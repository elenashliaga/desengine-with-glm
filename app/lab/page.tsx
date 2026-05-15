import { TasksScreen } from "@/components/desengine/task/TasksScreen"
import { requireAccessOrRedirect } from "@/lib/auth/server"
import { getTaskListItems } from "@/lib/system/server"
import { getTasksRootUrl } from "@/lib/task/navigation"

export default async function Page() {
  await requireAccessOrRedirect(getTasksRootUrl())
  const tasks = await getTaskListItems()

  return <TasksScreen tasks={tasks} />
}
