import fs from "fs";
import path from "path";

const MODEL = "qwen2.5-coder:3b";
const OLLAMA_URL = "http://localhost:11434/api/generate";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", chunk => data += chunk);
    process.stdin.on("end", () => resolve(data));
  });
}

function extractPropsFromCode(code) {
  const typeMatch = code.match(/type\s+GeneratedProps\s*=\s*{([\s\S]*?)}/);

  if (!typeMatch) {
    return {};
  }

  const body = typeMatch[1];

  const props = {};

  const regex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\??\s*:\s*(string|number|boolean)/g;

  let match;

  while ((match = regex.exec(body)) !== null) {
    const name = match[1];
    const type = match[2];

    if (type === "string") {
      props[name] = `Test ${name}`;
    } else if (type === "number") {
      props[name] = 123;
    } else if (type === "boolean") {
      props[name] = true;
    }
  }

  return props;
}

function normalizeComponent(code) {
  let result = code;

  result = result.replace(
    /type\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*{/,
    "type GeneratedProps = {"
  );

  result = result.replace(
    /interface\s+[A-Za-z_$][A-Za-z0-9_$]*\s*{/,
    "interface GeneratedProps {"
  );

  result = result.replace(
    /export\s+default\s+function\s+[A-Za-z_$][A-Za-z0-9_$]*/,
    "export default function Generated"
  );

  result = result.replace(
    /\(\s*props\s*:\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\)/,
    "(props: GeneratedProps)"
  );

  return result;
}

function cleanCode(rawCode) {
  let code = rawCode || "";

  code = code.replace(/```[a-zA-Z]*\n?/g, "");
  code = code.replace(/```/g, "");

  const exportMatch = code.match(/export\s+default\s+function\s+[A-Za-z_$][A-Za-z0-9_$]*/);

  if (!exportMatch) {
    throw new Error(`Invalid component shape:\n${code}`);
  }

  const lastBrace = code.lastIndexOf("}");

  if (lastBrace === -1) {
    throw new Error(`No closing brace:\n${code}`);
  }

  return code.slice(0, lastBrace + 1).trim();
}

async function run() {
  const task = await readStdin();

  const systemPrompt = fs.readFileSync(
    path.resolve("prompts/react-code.system.md"),
    "utf-8"
  );

  const prompt = `${systemPrompt}

ЗАДАЧА:
${task}
`;

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false
    })
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(JSON.stringify(data, null, 2));
  }

const raw = data.response || "";

let code = cleanCode(raw);
code = normalizeComponent(code);

const props = extractPropsFromCode(code);
const propsJson = JSON.stringify(props, null, 2);

  const appRoot = path.resolve("../..");

  fs.writeFileSync(
    path.join(appRoot, "generated", "Generated.tsx"),
    code,
    "utf-8"
  );

  fs.writeFileSync(
    path.join(appRoot, "generated", "props.json"),
    propsJson,
    "utf-8"
  );


  console.log(JSON.stringify({
    ok: true,
    code,
    props: JSON.parse(propsJson)
  }));
}

run().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message
  }));
  process.exit(1);
});
