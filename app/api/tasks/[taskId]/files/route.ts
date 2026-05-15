import { writeFile } from "node:fs/promises"

import {
  getLevelEditableWorkbenchFileMap,
  getTaskLabContext,
  getTaskListItemById,
} from "@/lib/system/server"
import { requireAccessOrUnauthorizedResponse } from "@/lib/auth/server"
import { ensureUserTaskDir, getUserTaskFilePath } from "@/lib/user/server"

type Params = { taskId: string }

type Body = {
  updates: Array<{
    fileId: string
    content: string
  }>
}

export async function POST(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

  const { taskId } = await params
  const body = (await request.json().catch(() => null)) as Body | null
  const taskItem = await getTaskListItemById(taskId)

  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const labContext = await getTaskLabContext(taskItem)

  const updates = Array.isArray(body?.updates) ? body.updates : []

  const editable = getLevelEditableWorkbenchFileMap(labContext.editableFileIds)

  const errors: Array<{ fileId: string; error: string }> = []
  let written = 0
  await ensureUserTaskDir(taskId)

  for (const update of updates) {
    if (!update || typeof update.fileId !== "string") continue

    const fileName = editable.get(update.fileId)
    if (!fileName) continue
    if (fileName.toLowerCase().endsWith(".png")) continue

    const filePath = getUserTaskFilePath(taskId, fileName)
    try {
      await writeFile(filePath, update.content ?? "", "utf-8")
      written += 1
    } catch (error) {
      errors.push({
        fileId: update.fileId,
        error: error instanceof Error ? error.message : "Ошибка записи файла",
      })
    }
  }

  if (errors.length) {
    return Response.json({ ok: false, written, errors }, { status: 500 })
  }

  return Response.json({ ok: true, written })
}
