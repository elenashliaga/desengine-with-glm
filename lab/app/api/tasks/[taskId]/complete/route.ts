import {
  completeCurrentTaskLevel,
  getTaskListItemById,
  readTaskData,
} from "@/lib/server"

type Params = { taskId: string }

export async function POST(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params
  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const progressUpdate = await completeCurrentTaskLevel(taskId, "manual")
  const nextTaskItem = await getTaskListItemById(taskId)
  const taskData = await readTaskData({ id: taskId })

  return Response.json({
    ok: true,
    taskData,
    taskItem: nextTaskItem ? { ...nextTaskItem, progress: progressUpdate.summary } : null,
    transition: progressUpdate.transition,
  })
}
