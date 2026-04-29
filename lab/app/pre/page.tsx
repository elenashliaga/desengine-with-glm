import fs from "fs";
import path from "path";
import PageShell  from "@/components/desengine/PageShell";
import TaskRunner from "@/components/desengine/TaskRunner";
import LabWorkspace from "@/components/desengine/LabWorkspace";

export default function Page() {
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
      <TaskRunner initialTask={taskText} />
      <LabWorkspace initialPropsText={propsText} code={code} />
    </PageShell>
  );
};