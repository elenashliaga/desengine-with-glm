import { readFile } from "node:fs/promises"

import { getTaskCatalogFilePath } from "@/lib/user-state.server"

type Params = { taskId: string; imageId: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId, imageId } = await params
  const imagePath = getTaskCatalogFilePath(taskId, `${imageId}.png`)

  try {
    const buf = await readFile(imagePath)
    return new Response(buf, {
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    })
  } catch {
    return Response.json({ ok: false, error: "Картинка не найдена" }, { status: 404 })
  }
}
