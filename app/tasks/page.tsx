import { HomeTaskList } from "@/components/desengine/HomeTaskList"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createTasksPath } from "@/lib/navigation"
import { getTaskListItems } from "@/lib/server"

export default async function TasksPage() {
  await requireAccessOrRedirect(createTasksPath())

  const tasks = await getTaskListItems()

  return <HomeTaskList initialTasks={tasks} />
}
