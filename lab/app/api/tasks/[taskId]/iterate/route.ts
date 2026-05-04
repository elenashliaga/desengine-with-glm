import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  appendPromptHistory,
  appConfig,
  isTaskStarted,
  readPromptHistory,
  readTaskData,
} from "@/lib/server"
import { readPrompt } from "@/lib/prompts.server"

type Params = { taskId: string }

type Body = {
  prompt?: string
  selectedFileIds?: string[]
}

type FilesPayload = Record<"component" | "stories" | "styles" | "mock" | "props", string | null>

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
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params
  const body = (await request.json().catch(() => null)) as Body | null
  const promptText = String(body?.prompt || "").trim()

  if (!promptText) {
    return Response.json({ ok: false, error: "Введите уточняющий промпт" }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: "OPENAI_API_KEY не настроен" }, { status: 400 })
  }

  const started = await isTaskStarted(taskId)
  if (!started) {
    return Response.json({ ok: false, error: "Сначала запустите задачу" }, { status: 400 })
  }

  const imagePath = path.join(appConfig.tasksRoot, taskId, appConfig.taskImageFile)

  let imageBase64: string
  try {
    const buf = await readFile(imagePath)
    imageBase64 = buf.toString("base64")
  } catch {
    return Response.json({ ok: false, error: "Картинка задания не найдена" }, { status: 404 })
  }

  const editableFiles = appConfig.taskWorkbenchFiles.filter((file) => file.edit === true)
  const editableById = new Map(editableFiles.map((file) => [file.id, file] as const))

  const requestedFileIds = Array.isArray(body?.selectedFileIds)
    ? body.selectedFileIds.filter((fileId): fileId is string => typeof fileId === "string")
    : []

  const selectedFileIds = requestedFileIds.length
    ? requestedFileIds.filter((fileId) => editableById.has(fileId))
    : editableFiles.map((file) => file.id)

  if (selectedFileIds.length === 0) {
    return Response.json({ ok: false, error: "Выберите хотя бы один файл для контекста" }, { status: 400 })
  }

  const taskData = await readTaskData({ id: taskId, image: { width: 0, height: 0 }, started: true })
  const promptHistory = await readPromptHistory(taskId)
  const productionPrompt = await readPrompt("production", "iterate-component")

  const selectedFiles = selectedFileIds.map((fileId) => {
    const file = editableById.get(fileId)
    return {
      id: fileId,
      fileName: file?.fileName || fileId,
      content: taskData.contentByFileId[fileId] ?? "",
    }
  })

  const historyText = promptHistory.length
    ? promptHistory
        .map((entry, index) => {
          const files = entry.selectedFileIds.length ? entry.selectedFileIds.join(", ") : "все файлы"
          return `${index + 1}. [${entry.createdAt}] Файлы: ${files}\n${entry.text}`
        })
        .join("\n\n")
    : "Истории уточнений пока нет."

  const fileList = editableFiles.map((file) => ({ id: file.id, fileName: file.fileName }))
  const selectedFilesText = selectedFiles
    .map((file) => `FILE ${file.id} (${file.fileName})\n\`\`\`tsx\n${file.content}\n\`\`\``)
    .join("\n\n")

  const instruction = `
${productionPrompt}

Верни JSON со всеми ключами "component", "stories", "styles", "mock", "props".
Если какой-то файл не нужно менять, верни для него null.

ТЕКУЩИЙ УТОЧНЯЮЩИЙ ПРОМПТ ПОЛЬЗОВАТЕЛЯ:
${promptText}

ИСТОРИЯ ПРЕДЫДУЩИХ ПРОМПТОВ ПО ЭТОМУ ЗАДАНИЮ:
${historyText}

ДОСТУПНЫЕ fileId:
${JSON.stringify(fileList, null, 2)}

В КОНТЕКСТ ЭТОЙ ИТЕРАЦИИ ВКЛЮЧЕНЫ ТОЛЬКО СЛЕДУЮЩИЕ ФАЙЛЫ:
${selectedFilesText}
`.trim()

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
          name: "desengine_iterate_component_files",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["component", "stories", "styles", "mock", "props"],
            properties: {
              component: { type: ["string", "null"] },
              stories: { type: ["string", "null"] },
              styles: { type: ["string", "null"] },
              mock: { type: ["string", "null"] },
              props: { type: ["string", "null"] },
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
      },
      { status: 500 },
    )
  }

  const editable = new Map(editableFiles.map((file) => [file.id, file.fileName] as const))

  for (const [fileId, content] of Object.entries(payload)) {
    const fileName = editable.get(fileId)
    if (!fileName || typeof content !== "string") continue

    const filePath = path.join(appConfig.tasksRoot, taskId, fileName)
    await writeFile(filePath, content, "utf-8")
  }

  await appendPromptHistory(taskId, {
    text: promptText,
    createdAt: new Date().toISOString(),
    selectedFileIds,
  })

  const nextTaskData = await readTaskData({ id: taskId, image: { width: 0, height: 0 }, started: true })
  return Response.json({ ok: true, taskData: nextTaskData })
}
