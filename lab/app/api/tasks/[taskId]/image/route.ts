import { readFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "@/lib/server"

type Params = { taskId: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  const imagePath = path.join(appConfig.tasksRoot, taskId, appConfig.taskImageFile)

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

