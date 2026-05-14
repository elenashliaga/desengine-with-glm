import { TasksScreen } from "@/components/desengine/task/TasksScreen"
import { requireAccessOrRedirect } from "@/lib/access/server"
import { getTaskListItems } from "@/lib/platform/server"
import { createTasksPath } from "@/lib/platform/navigation"

export default async function Page() {
  await requireAccessOrRedirect(createTasksPath())
  const tasks = await getTaskListItems()

  return <TasksScreen tasks={tasks} />
}
