import { notFound, redirect } from "next/navigation"

import { Lab } from "@/components/desengine/Lab"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createTaskNextPath, createTaskPath } from "@/lib/navigation"
import { getLevelOverview, getTaskLabContext, getTaskListItemById, getTaskPendingTransition, isTaskStarted, readTaskData } from "@/lib/server"

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

  if (!transition) {
    redirect(createTaskPath(taskId))
  }

  const labContext = await getTaskLabContext(taskItem)
  const started = await isTaskStarted(taskId)
  const taskData = started ? await readTaskData(taskItem, labContext) : null
  const levelOverview = await getLevelOverview(transition.toLevel?.id ?? transition.fromLevel.id)

  return (
    <Lab
      initLevelOverview={levelOverview}
      initScreen={{ type: "transition", transition }}
      initTaskItem={taskItem}
      initTaskData={taskData}
    />
  )
}
