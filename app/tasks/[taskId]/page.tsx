import { TasksScreen } from "@/components/desengine/task/TasksScreen"
import { requireAccessOrRedirect } from "@/lib/auth/server"
import { getTaskListItemById as getTaskItemById, getTaskListItems } from "@/lib/system/server"
import { getTaskUrl } from "@/lib/task/navigation"
import { getTasksRootUrl } from "@/lib/task/navigation"

import { TaskScreen } from "@/components/desengine/task/TaskScreen"

import { notFound } from "next/navigation"

type Params = {
  taskId: string
}


export default async function Page({
    params,
}: {
  params: Promise<Params>
}) {
  await requireAccessOrRedirect(getTasksRootUrl())
  const { taskId } = await params
  const canonicalPath = getTaskUrl(taskId)

  await requireAccessOrRedirect(canonicalPath)

  const taskItem = await getTaskItemById(taskId)

  if (!taskItem) {
    notFound()
  }

  return (<TaskScreen taskId={taskId} />)
}
