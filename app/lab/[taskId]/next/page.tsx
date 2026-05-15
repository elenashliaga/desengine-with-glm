import { notFound, redirect } from "next/navigation"

import { requireAccessOrRedirect } from "@/lib/auth/server"
import { createTaskNextPath, createLabUrl } from "@/lib/system/navigation"
import { getTaskListItemById, getTaskPendingTransition } from "@/lib/system/server"

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
    redirect(createLabUrl(taskId))
  }

  redirect(createLabUrl(taskId))
}
