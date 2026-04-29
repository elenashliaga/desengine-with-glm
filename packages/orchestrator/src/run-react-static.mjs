import fs from "fs";
import path from "path";

const MODEL = "qwen2.5-coder:3b";
const OLLAMA_URL = "http://localhost:11434/api/generate";

const root = path.resolve("../..");

const systemPromptPath = path.resolve("prompts/react-code.system.md");

const taskFile = process.argv[2];

if (!taskFile) {
  console.error("No task file provided");
  process.exit(1);
}

const taskPath = path.resolve("tasks", taskFile);

const systemPrompt = fs.readFileSync(systemPromptPath, "utf-8");
const task = fs.readFileSync(taskPath, "utf-8");

const targetPath = "../../lab/generated/Generated.tsx";

const prompt = `${systemPrompt}

ЗАДАЧА:
${task}
`;


function extractGeneratedCode(rawText) {
  let text = rawText || "";

  text = text.replace(/```[a-zA-Z]*\n?/g, "");
  text = text.replace(/```/g, "");

  const start = text.indexOf("export default function Generated");

  if (start === -1) {
    throw new Error(`Invalid shape: no export default function Generated\n\n${text}`);
  }

  text = text.slice(start);

  const lastBrace = text.lastIndexOf("}");

  if (lastBrace === -1) {
    throw new Error(`Invalid shape: no closing brace\n\n${text}`);
  }

  const code = text.slice(0, lastBrace + 1).trim();

  if (code.includes("```")) {
    throw new Error(`Markdown wrapper was not removed\n\n${code}`);
  }

  return code;
}




async function run() {
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
	  	console.error("Ollama error:");
  		console.error(JSON.stringify(data, null, 2));
  		return;
	}

  const code = extractGeneratedCode(data.response);

  fs.writeFileSync(targetPath, code, "utf-8");
}

run();
