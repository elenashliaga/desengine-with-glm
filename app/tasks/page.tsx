import { HomeTaskListPage } from "@/components/desengine/HomeTaskListPage"
import { createTasksPath } from "@/lib/navigation"

export default function TasksPage() {
  return <HomeTaskListPage canonicalPath={createTasksPath()} />
}
