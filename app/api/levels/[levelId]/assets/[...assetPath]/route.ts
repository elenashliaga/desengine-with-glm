import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { appConfig } from "@/lib/config/config.server"

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
}

function isSafePathSegment(segment: string) {
  return Boolean(segment) && segment !== "." && segment !== ".."
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      levelId: string
      assetPath: string[]
    }>
  },
) {
  const { levelId, assetPath } = await context.params

  if (
    !levelId
    || !Array.isArray(assetPath)
    || assetPath.length === 0
    || assetPath.some((segment) => !isSafePathSegment(segment))
  ) {
    return NextResponse.json({ error: "Некорректный путь к asset уровня" }, { status: 400 })
  }

  const levelRoot = path.resolve(appConfig.levelsCatalogRoot, levelId)
  const filePath = path.resolve(levelRoot, ...assetPath)

  if (filePath !== levelRoot && !filePath.startsWith(`${levelRoot}${path.sep}`)) {
    return NextResponse.json({ error: "Выход за пределы каталога уровня запрещён" }, { status: 400 })
  }

  try {
    const fileBuffer = await readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()

    return new NextResponse(fileBuffer, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "Content-Type": CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream",
      },
    })
  } catch {
    return NextResponse.json({ error: "Asset уровня не найден" }, { status: 404 })
  }
}
