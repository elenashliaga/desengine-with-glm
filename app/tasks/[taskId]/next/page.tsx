import { notFound, redirect } from "next/navigation"

import { requireAccessOrRedirect } from "@/lib/access/access-control.server"
import { createTaskNextPath, createTaskPath } from "@/lib/platform/navigation"
import { getTaskListItemById, getTaskPendingTransition } from "@/lib/platform/server"

type Params = {
  taskId: string
}

export default async function TaskNextPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { taskId } = await params
  const canonicalPath = createTaskNextPath(taskId)

  await requireAccessOrRedirect(canonicalPath)

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    notFound()
  }

  const transition = await getTaskPendingTransition(taskId)

  if (!transition || !transition.toLevel) {
    redirect(createTaskPath(taskId))
  }

  redirect(createTaskPath(taskId))
}
