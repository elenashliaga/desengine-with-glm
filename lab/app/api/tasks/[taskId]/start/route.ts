import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  appConfig,
  getLevelForTaskItem,
  getTaskListItemById,
  isTaskStarted,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  readTaskData,
} from "@/lib/server"
import { runStructuredLlmRequest, toLlmErrorResponse } from "@/lib/llm.server"
import { readLevelDidacticPrompt, readPrompt } from "@/lib/prompts.server"

type Params = { taskId: string }

type FilesPayload = Record<string, string>

function extractJson(text: string): unknown {
  const trimmed = (text || "").trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : trimmed

  return JSON.parse(candidate)
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  const taskItem = await getTaskListItemById(taskId)
  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const level = await getLevelForTaskItem(taskItem)
  const already = await isTaskStarted(taskId)

  if (already && taskItem.progress.currentLevelInitialized) {
    const progress = await markTaskLevelInProgress(taskId)
    const taskData = await readTaskData(taskItem)
    return Response.json({ ok: true, taskData, taskItem: { ...taskItem, progress }, level })
  }

  const imagePath = path.join(appConfig.tasksRoot, taskId, appConfig.taskImageFile)

  let imageBase64: string
  try {
    const buf = await readFile(imagePath)
    imageBase64 = buf.toString("base64")
  } catch {
    return Response.json({ ok: false, error: "Картинка задания не найдена" }, { status: 404 })
  }

  const [prod, did, levelDidactic, taskData] = await Promise.all([
    readPrompt("production", "start-component"),
    readPrompt("didactic", "start-component"),
    readLevelDidacticPrompt(level.promptKey),
    readTaskData(taskItem),
  ])

  const editableFiles = appConfig.taskWorkbenchFiles.filter((f) => f.edit === true)
  const fileList = editableFiles.map((f) => ({ id: f.id, fileName: f.fileName }))
  const filesText = editableFiles
    .map((file) => {
      const content = taskData.contentByFileId[file.id] ?? ""
      return `FILE ${file.id} (${file.fileName})\n\`\`\`tsx\n${content}\n\`\`\``
    })
    .join("\n\n")

  const instruction = already
    ? `
${prod}

${did}

${levelDidactic}

ЗАДАНИЕ:
Это инициирующий запуск нового уровня для уже существующей задачи.
Посмотри на PNG-картинку и на все текущие файлы задачи.
Подготовь компонент к работе на уровне ${level.number}, сохранив полезные наработки и обновив реализацию там, где это требуется новой дидактикой уровня.

Верни полный набор файлов по ключам:
${JSON.stringify(fileList, null, 2)}

ТЕКУЩЕЕ СОСТОЯНИЕ ВСЕХ ФАЙЛОВ:
${filesText}
`.trim()
    : `
${prod}

${did}

${levelDidactic}

ЗАДАНИЕ:
По PNG-картинке создай первичную реализацию набора файлов компонента.

Ключи результата соответствуют fileId из списка:
${JSON.stringify(fileList, null, 2)}
`.trim()

  let outputText = ""
  try {
    const result = await runStructuredLlmRequest({
      target: "init",
      instruction,
      imageBase64,
      schemaName: "desengine_start_component_files",
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
    })
    outputText = result.outputText
  } catch (error) {
    const response = toLlmErrorResponse(error)
    return Response.json(response.body, { status: response.status })
  }

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
        },
      },
      { status: 500 },
    )
  }

  const editable = new Map(
    editableFiles.map((f) => [f.id, f.fileName] as const),
  )

  for (const [fileId, content] of Object.entries(payload)) {
    const fileName = editable.get(fileId)
    if (!fileName) continue
    const filePath = path.join(appConfig.tasksRoot, taskId, fileName)
    await writeFile(filePath, String(content ?? ""), "utf-8")
  }

  const progress = await markCurrentTaskLevelInitialized(taskId)
  const nextTaskItem = await getTaskListItemById(taskId)
  const nextTaskData = await readTaskData({ id: taskId })
  return Response.json({
    ok: true,
    taskData: nextTaskData,
    taskItem: nextTaskItem ? { ...nextTaskItem, progress } : { ...taskItem, progress },
    level,
  })
}
