import { hasAccessSession } from "@/lib/access-control.server"
import { getTaskListItemById, publishTaskSnapshot } from "@/lib/server"
import { SnapshotPublishError } from "@/lib/snapshot.server"

type Params = { taskId: string }

export async function POST(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  if (!(await hasAccessSession())) {
    return Response.json(
      { ok: false, error: "Нужен актуальный allowlist-допуск." },
      { status: 403 },
    )
  }

  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  try {
    const { snapshot, snapshotPath } = await publishTaskSnapshot(taskId)
    const origin = new URL(request.url).origin

    return Response.json({
      ok: true,
      snapshot,
      snapshotPath,
      snapshotUrl: new URL(snapshotPath, origin).toString(),
    })
  } catch (error) {
    if (error instanceof SnapshotPublishError) {
      const status = error.code === "TASK_NOT_STARTED" ? 409 : 400

      return Response.json(
        {
          ok: false,
          error: error.message,
          errorCode: error.code,
          violations: error.violations,
        },
        { status },
      )
    }

    return Response.json(
      { ok: false, error: "Не удалось опубликовать слепок" },
      { status: 500 },
    )
  }
}
