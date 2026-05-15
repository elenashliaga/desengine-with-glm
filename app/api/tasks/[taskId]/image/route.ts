import { readFile } from "node:fs/promises"

import { requireAccessOrUnauthorizedResponse } from "@/lib/auth/server"
import { getTaskCatalogFilePath } from "@/lib/user/server"

type Params = { taskId: string }

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

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
