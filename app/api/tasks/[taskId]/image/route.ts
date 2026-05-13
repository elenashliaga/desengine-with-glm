import { readFile } from "node:fs/promises"

import { getTaskCatalogFilePath } from "@/lib/platform/user-state.server"

type Params = { taskId: string }

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params
  const { searchParams } = new URL(request.url)
  const imageId = searchParams.get("imageId")?.trim() || "base"

  const requestedImagePath = getTaskCatalogFilePath(taskId, `${imageId}.png`)

  try {
    const buf = await readFile(requestedImagePath)
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
