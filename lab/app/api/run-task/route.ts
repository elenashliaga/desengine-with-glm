import fs from "fs";
import { execFile } from "child_process";
import path from "path";

export async function POST(request: Request) {
  const body = await request.json();
  const task = String(body.task || "");

  const labRoot = process.cwd();
  const taskPath = path.join(labRoot, "generated", "task.md");

  fs.writeFileSync(taskPath, task, "utf-8");

  const root = path.resolve(process.cwd(), "../..");
  const orchestratorDir = path.join(root, "packages", "orchestrator");

  return new Promise<Response>((resolve) => {
    const child = execFile(
      "node",
      ["src/run-react-task.mjs"],
      { cwd: orchestratorDir },
      (error, stdout, stderr) => {
        if (error) {
          resolve(Response.json({
            ok: false,
            error: stderr || error.message
          }, { status: 500 }));
          return;
        }

        try {
          resolve(Response.json(JSON.parse(stdout)));
        } catch {
          resolve(Response.json({
            ok: false,
            error: stdout || stderr
          }, { status: 500 }));
        }
      }
    );

    child.stdin?.write(task);
    child.stdin?.end();
  });
}