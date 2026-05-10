import { notFound, redirect } from "next/navigation"

import { Lab } from "@/components/desengine/Lab"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createTaskCheckPath, createTaskPath } from "@/lib/navigation"
import { getLevelOverview, getTaskCheckResult, getTaskLabContext, getTaskListItemById, getTaskPendingTransition, isTaskStarted, readTaskData } from "@/lib/server"

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

export default async function TaskCheckPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { taskId } = await params
  const canonicalPath = createTaskCheckPath(taskId)

  await requireAccessOrRedirect(canonicalPath)

  const [taskItem, checkResult] = await Promise.all([
    getTaskListItemById(taskId),
    getTaskCheckResult(taskId),
  ])

  if (!taskItem) {
    notFound()
  }

  if (!checkResult) {
    redirect(createTaskPath(taskId))
  }

  const transition = checkResult.kind === "passed"
    ? await getTaskPendingTransition(taskId)
    : null

  const labContext = await getTaskLabContext(taskItem)
  const started = await isTaskStarted(taskId)
  const taskData = started
    ? await readTaskData(taskItem, labContext)
    : createEmptyTaskData(taskId, labContext)
  const levelOverview = await getLevelOverview(taskItem.progress.currentLevelId)

  return (
    <Lab
      initLevelOverview={levelOverview}
      initScreen={{ type: "check", result: checkResult, transition }}
      initTaskItem={taskItem}
      initTaskData={taskData}
    />
  )
}
