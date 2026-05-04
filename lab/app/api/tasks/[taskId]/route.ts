import { getTaskListItems, isTaskStarted, readTaskData } from "@/lib/server"

type Params = { taskId: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  const tasks = await getTaskListItems()
  const taskItem = tasks.find((t) => t.id === taskId)

  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const started = await isTaskStarted(taskId)
  const taskData = started ? await readTaskData(taskItem) : { taskId: taskId, contentByFileId: {}, promptHistory: [] }

  return Response.json({
    ok: true,
    taskItem,
    started,
    taskData,
  })
}
