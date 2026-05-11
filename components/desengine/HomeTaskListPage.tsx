import { HomeTaskList } from "@/components/desengine/HomeTaskList"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { getTaskListItems } from "@/lib/server"

type HomeTaskListPageProps = {
  canonicalPath: string
}

export async function HomeTaskListPage({ canonicalPath }: HomeTaskListPageProps) {
  await requireAccessOrRedirect(canonicalPath)

  const tasks = await getTaskListItems()

  return <HomeTaskList initialTasks={tasks} />
}
