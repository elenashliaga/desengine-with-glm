import { readFile } from "node:fs/promises"

import { appConfig } from "@/lib/server"
import { getTaskCatalogFilePath } from "@/lib/user-state.server"

type Params = { taskId: string }

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params
  const { searchParams } = new URL(request.url)
  const imageId = searchParams.get("imageId")?.trim() || "base"

  const requestedImagePath = getTaskCatalogFilePath(taskId, `${imageId}.png`)
  const legacyImagePath = getTaskCatalogFilePath(taskId, appConfig.taskImageFile)

  try {
    const buf = await readFile(requestedImagePath)
    return new Response(buf, {
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    })
  } catch {
    if (imageId === "base") {
      try {
        const buf = await readFile(legacyImagePath)
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

    return Response.json({ ok: false, error: "Картинка не найдена" }, { status: 404 })
  }
}
