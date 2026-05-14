import { notFound, redirect } from "next/navigation"

import { Lab } from "@/components/desengine/lab/LabScreen"
import { requireAccessOrRedirect } from "@/lib/access/server"
import { createLabUrl, isAccessibleTaskScreen } from "@/lib/platform/navigation"
import { getLevelOverview, getTaskLabContext, getTaskListItemById, isTaskStarted, readTaskData } from "@/lib/platform/server"

type Params = {
  taskId: string
  screen: string
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

export default async function TaskScreenPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { taskId, screen } = await params
  const canonicalPath = createLabUrl(taskId, screen)

  await requireAccessOrRedirect(canonicalPath)

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    notFound()
  }

  const labContext = await getTaskLabContext(taskItem)
  const allowedScreens = labContext?.editableFileIds ?? []

  if (allowedScreens.length === 0) {
    notFound()
  }

  if (!isAccessibleTaskScreen(screen, allowedScreens)) {
    redirect(createLabUrl(taskId))
  }

  const started = await isTaskStarted(taskId)
  const taskData = started
    ? await readTaskData(taskItem, labContext)
    : createEmptyTaskData(taskId, labContext)
  const levelOverview = await getLevelOverview(taskItem.progress.currentLevelId)

  return (
    <Lab
      initLevelOverview={levelOverview}
      initScreen={{ type: "task", screen }}
      initTaskItem={taskItem}
      initTaskData={taskData}
    />
  )
}
