import { notFound, redirect } from "next/navigation"

import { Lab } from "@/components/desengine/lab/LabScreen"
import { requireAccessOrRedirect } from "@/lib/access/access-control.server"
import { createTaskPath, getDefaultTaskScreen, isAccessibleTaskScreen } from "@/lib/platform/navigation"
import { getLevelOverview, getTaskLabContext, getTaskListItemById, isTaskStarted, readTaskData } from "@/lib/platform/server"

type Params = {
  taskId: string
}

function createEmptyTaskData(taskId: string, labContext: Awaited<ReturnType<typeof getTaskLabContext>>) {
  return {
    taskId,
    contentByFileId: {},
    promptHistory: [],
    llmUsageSummary: {
      totalCalls: 0,
      teachingCostCents: 0,
      providersUsed: [],
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      callsWithoutProviderMetrics: 0,
    },
    labContext,
  }
}

export default async function TaskPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { taskId } = await params
  const canonicalPath = createTaskPath(taskId)

  await requireAccessOrRedirect(canonicalPath)

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    notFound()
  }

  const labContext = await getTaskLabContext(taskItem)
  const allowedScreens = labContext?.editableFileIds ?? []
  const defaultScreen = getDefaultTaskScreen()

  if (allowedScreens.length === 0) {
    notFound()
  }

  if (!isAccessibleTaskScreen(defaultScreen, allowedScreens)) {
    redirect(createTaskPath(taskId, allowedScreens[0]))
  }

  const started = await isTaskStarted(taskId)
  const taskData = started
    ? await readTaskData(taskItem, labContext)
    : createEmptyTaskData(taskId, labContext)
  const levelOverview = await getLevelOverview(taskItem.progress.currentLevelId)

  return (
    <Lab
      initLevelOverview={levelOverview}
      initScreen={{ type: "task", screen: defaultScreen }}
      initTaskItem={taskItem}
      initTaskData={taskData}
    />
  )
}
