import { TasksPage } from "@/components/desengine/tasks/TasksPage"
import { requireAccessOrRedirect } from "@/lib/access/access-control.server"
import { createTasksPath } from "@/lib/platform/navigation"

export default async function Page() {
  await requireAccessOrRedirect(createTasksPath())

  return <TasksPage canonicalPath={createTasksPath()} />
}
