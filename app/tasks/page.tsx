import { TasksScreen } from "@/components/desengine/task/TasksScreen"
import { requireAccessOrRedirect } from "@/lib/auth/server"
import { getTasks } from "@/lib/task/server"
import { getTasksRootUrl } from "@/lib/task/navigation"

export default async function Page() {
  await requireAccessOrRedirect(getTasksRootUrl())
  const tasks = await getTasks()

  return <TasksScreen tasks={tasks} />
}
