import { notFound, redirect } from "next/navigation"

import { Lab } from "@/components/desengine/lab/LabScreen"
import { requireAccessOrRedirect } from "@/lib/auth/server"
import { createTaskDonePath, createLabUrl } from "@/lib/system/navigation"
import { getLevelOverview, getTaskDoneTransition, getTaskLabContext, getTaskListItemById, isTaskStarted, readTaskData } from "@/lib/system/server"

type Params = {
  taskId: string
}

export default async function TaskDonePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { taskId } = await params
  const canonicalPath = createTaskDonePath(taskId)

  await requireAccessOrRedirect(canonicalPath)

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    notFound()
  }

  const transition = await getTaskDoneTransition(taskId)

  if (!transition) {
    redirect(createLabUrl(taskId))
  }

  const labContext = await getTaskLabContext(taskItem)
  const started = await isTaskStarted(taskId)
  const taskData = started ? await readTaskData(taskItem, labContext) : null
  const levelOverview = await getLevelOverview(transition.fromLevel.id)

  return (
    <Lab
      initLevelOverview={levelOverview}
      initScreen={{ type: "done", transition }}
      initTaskItem={taskItem}
      initTaskData={taskData}
    />
  )
}
