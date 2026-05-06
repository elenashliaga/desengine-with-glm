import {
  getTaskListItemById,
  resetTask,
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

  await resetTask(taskId)

  const nextTaskItem = await getTaskListItemById(taskId)

  return Response.json({
    ok: true,
    taskItem: nextTaskItem,
  })
}
