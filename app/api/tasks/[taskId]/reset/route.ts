import {
  clearTaskCheckResult,
  getTaskLabContext,
  getTaskListItemById,
  resetTask,
} from "@/lib/platform/server"
import { requireAccessOrUnauthorizedResponse } from "@/lib/access/access-control.server"

type Params = { taskId: string }

export async function POST(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

  const { taskId } = await params

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  await resetTask(taskId)
  await clearTaskCheckResult(taskId)
  const nextTaskItem = await getTaskListItemById(taskId)
  const labContext = nextTaskItem ? await getTaskLabContext(nextTaskItem) : null

  return Response.json({
    ok: true,
    taskItem: nextTaskItem,
    taskData: nextTaskItem
      ? {
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
      : null,
    started: false,
  })
}
