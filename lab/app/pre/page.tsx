import fs from "fs";
import path from "path";
import PageShell  from "@/components/desengine/PageShell";
import TaskRunner from "@/components/desengine/TaskRunner";
import LabWorkspace from "@/components/desengine/LabWorkspace";
import { getLlmStatus } from "@/lib/llm.server";

export default async function Page() {
  const llmStatus = await getLlmStatus();

  const generatedPath = path.join(process.cwd(), "generated", "Generated.tsx");
  const propsPath = path.join(process.cwd(), "generated", "props.json");
  const taskPath = path.join(process.cwd(), "generated", "task.md");

  const code = fs.readFileSync(generatedPath, "utf-8");
  const propsText = fs.readFileSync(propsPath, "utf-8");

  const taskText = fs.existsSync(taskPath)
    ? fs.readFileSync(taskPath, "utf-8")
    : "";

  return (
    <PageShell>
      <div className="rounded-md border p-3 text-sm">
        <strong>LLM-провайдер:</strong> {llmStatus.label}.{" "}
        <strong>Статус:</strong> {llmStatus.availability.message}.
        {llmStatus.config.model ? ` Модель: ${llmStatus.config.model}.` : ""}
        {!llmStatus.ready && (
          <div className="mt-1 text-muted-foreground">
            Настрой `lab/.env.local`. См. `lab/env/openai.md`.
          </div>
        )}
      </div>
      <TaskRunner initialTask={taskText} />
      <LabWorkspace initialPropsText={propsText} code={code} />
    </PageShell>
  );
};
