import { TasksScreen } from "@/components/desengine/tasks/TasksScreen"
import { requireAccessOrRedirect } from "@/lib/access/access-control.server"
import { getTaskListItems } from "@/lib/platform/server"

type TasksPageProps = {
  canonicalPath: string
}

export async function TasksPage({ canonicalPath }: TasksPageProps) {
  await requireAccessOrRedirect(canonicalPath)

  const tasks = await getTaskListItems()

  return <TasksScreen initialTasks={tasks} />
}
