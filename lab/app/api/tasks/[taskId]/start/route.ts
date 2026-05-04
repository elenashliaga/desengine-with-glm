import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { appConfig, isTaskStarted, readTaskData } from "@/lib/server"
import { readPrompt } from "@/lib/prompts.server"

type Params = { taskId: string }

type FilesPayload = Record<string, string>

function extractJson(text: string): unknown {
  const trimmed = (text || "").trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : trimmed

  return JSON.parse(candidate)
}

function getOutputText(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "output_text" in data &&
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text
  }

  const output =
    data &&
    typeof data === "object" &&
    "output" in data &&
    Array.isArray(data.output)
      ? data.output
      : []

  for (const item of output) {
    const content = item && typeof item === "object" && Array.isArray(item.content) ? item.content : []
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        part.type === "output_text" &&
        typeof part.text === "string" &&
        part.text.trim()
      ) {
        return part.text
      }
    }
  }

  return ""
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: "OPENAI_API_KEY не настроен" }, { status: 400 })
  }

  const already = await isTaskStarted(taskId)
  if (already) {
    const taskData = await readTaskData({ id: taskId, image: { width: 0, height: 0 }, started: true })
    return Response.json({ ok: true, taskData })
  }

  const imagePath = path.join(appConfig.tasksRoot, taskId, appConfig.taskImageFile)

  let imageBase64: string
  try {
    const buf = await readFile(imagePath)
    imageBase64 = buf.toString("base64")
  } catch {
    return Response.json({ ok: false, error: "Картинка задания не найдена" }, { status: 404 })
  }

  const [prod, did] = await Promise.all([
    readPrompt("production", "start-component"),
    readPrompt("didactic", "start-component"),
  ])

  const fileList = appConfig.taskWorkbenchFiles
    .filter((f) => f.edit === true)
    .map((f) => ({ id: f.id, fileName: f.fileName }))

  const instruction = `
${prod}

${did}

ЗАДАНИЕ:
По PNG-картинке создай первичную реализацию набора файлов компонента.

Ключи результата соответствуют fileId из списка:
${JSON.stringify(fileList, null, 2)}
`.trim()

  // Structured Outputs (json_schema) поддерживаются не всеми моделями.
  // Берём совместимую по умолчанию, но оставляем возможность переопределить env-переменной.
  const model = process.env.DESENGINE_OPENAI_MODEL || "gpt-4o-2024-08-06"

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      text: {
        format: {
          type: "json_schema",
          name: "desengine_start_component_files",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["component", "stories", "styles", "mock", "props"],
            properties: {
              component: { type: "string" },
              stories: { type: "string" },
              styles: { type: "string" },
              mock: { type: "string" },
              props: { type: "string" },
            },
          },
        },
      },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: instruction },
            { type: "input_image", image_url: `data:image/png;base64,${imageBase64}` },
          ],
        },
      ],
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    return Response.json({ ok: false, error: data?.error?.message || "Ошибка OpenAI API" }, { status: 500 })
  }

  const outputText = getOutputText(data)
  let payload: FilesPayload
  try {
    const parsed = extractJson(outputText)
    if (!parsed || typeof parsed !== "object") throw new Error("Ответ не является JSON-объектом")
    payload = parsed as FilesPayload
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось разобрать ответ",
        debug: {
          outputTextPreview: outputText.slice(0, 800),
          outputTextLength: outputText.length,
          outputItemTypes: Array.isArray(data?.output) ? data.output.map((i: { type?: string }) => i?.type).filter(Boolean) : [],
        },
      },
      { status: 500 },
    )
  }

  const editable = new Map(
    appConfig.taskWorkbenchFiles
      .filter((f) => f.edit === true)
      .map((f) => [f.id, f.fileName] as const),
  )

  for (const [fileId, content] of Object.entries(payload)) {
    const fileName = editable.get(fileId)
    if (!fileName) continue
    const filePath = path.join(appConfig.tasksRoot, taskId, fileName)
    await writeFile(filePath, String(content ?? ""), "utf-8")
  }

  const taskData = await readTaskData({ id: taskId, image: { width: 0, height: 0 }, started: true })
  return Response.json({ ok: true, taskData })
}
