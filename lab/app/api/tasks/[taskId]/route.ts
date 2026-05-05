import {
  getLevelForTaskItem,
  getTaskLabContext,
  getTaskListItemById,
  isTaskStarted,
  readTaskData,
} from "@/lib/server"

type Params = { taskId: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const started = await isTaskStarted(taskId)
  const labContext = await getTaskLabContext(taskItem)
  const taskData = started
    ? await readTaskData(taskItem, labContext)
    : {
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
  const level = await getLevelForTaskItem(taskItem)

  return Response.json({
    ok: true,
    taskItem,
    started,
    taskData,
    level,
  })
}
