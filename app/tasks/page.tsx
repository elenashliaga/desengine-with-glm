import { HomeTaskListPage } from "@/components/desengine/HomeTaskListPage"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createTasksPath } from "@/lib/navigation"

export default async function TasksPage() {
  await requireAccessOrRedirect(createTasksPath())

  return <HomeTaskListPage canonicalPath={createTasksPath()} />
}
