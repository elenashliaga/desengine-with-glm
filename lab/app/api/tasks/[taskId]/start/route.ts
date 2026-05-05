import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  appConfig,
  getLevelForTaskItem,
  getTaskLabContext,
  getTaskListItemById,
  isTaskStarted,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  readTaskData,
} from "@/lib/server"
import { runStructuredLlmRequest, toLlmErrorResponse } from "@/lib/llm.server"
import { readLevelDidacticPrompt, readLevelInitPrompt, readPrompt } from "@/lib/prompts.server"

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
  const startedAt = Date.now()

  console.log("[desengine][task-start] start", { taskId })

  const taskItem = await getTaskListItemById(taskId)
  if (!taskItem) {
    console.error("[desengine][task-start] task_not_found", { taskId })
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const level = await getLevelForTaskItem(taskItem)
  const labContext = await getTaskLabContext(taskItem)
  const already = await isTaskStarted(taskId)

  if (already && taskItem.progress.currentLevelInitialized) {
    const progress = await markTaskLevelInProgress(taskId)
    const taskData = await readTaskData(taskItem, labContext)
    return Response.json({ ok: true, taskData, taskItem: { ...taskItem, progress }, level })
  }

  const promptImages = labContext.images.filter((image) => image.show)
  if (promptImages.length === 0) {
    console.error("[desengine][task-start] missing_prompt_images", { taskId })
    return Response.json({ ok: false, error: "Для уровня не настроены картинки для LLM-контекста" }, { status: 400 })
  }

  let imageBase64List: string[]
  try {
    imageBase64List = await Promise.all(
      promptImages.map(async (image) => {
        const imagePath = path.join(appConfig.tasksRoot, taskId, `${image.id}.png`)
        const buf = await readFile(imagePath)
        return buf.toString("base64")
      }),
    )
  } catch {
    console.error("[desengine][task-start] missing_required_images", {
      taskId,
      imageIds: promptImages.map((image) => image.id),
    })
    return Response.json({ ok: false, error: "Не найдены обязательные картинки текущего уровня" }, { status: 404 })
  }

  const [prod, did, levelDidactic, levelInitPrompt, taskData] = await Promise.all([
    readPrompt("production", "start-component"),
    readPrompt("didactic", "start-component"),
    readLevelDidacticPrompt(level.promptKey),
    readLevelInitPrompt(level.id, level.promptKey),
    readTaskData(taskItem, labContext),
  ])

  const outputFiles = appConfig.taskWorkbenchFiles.filter((f) => f.edit === true)
  const fileList = outputFiles.map((f) => ({ id: f.id, fileName: f.fileName }))
  const filesText = outputFiles
    .map((file) => {
      const content = taskData.contentByFileId[file.id] ?? ""
      return `FILE ${file.id} (${file.fileName})\n\`\`\`tsx\n${content}\n\`\`\``
    })
    .join("\n\n")

  const imagesText = promptImages
    .map((image) => `- ${image.id}.png — ${image.width}x${image.height}`)
    .join("\n")

  const instruction = already
    ? `
${prod}

${did}

${levelDidactic}

${levelInitPrompt}

ОБЩЕЕ ПОЯСНЕНИЕ УРОВНЯ:
${labContext.commonExplanation}

УНИКАЛЬНОЕ ПОЯСНЕНИЕ ЭТОЙ ЗАДАЧИ:
${labContext.taskExplanation}

ЗАДАНИЕ:
Это инициирующий запуск нового уровня для уже существующей задачи.
Посмотри на картинки текущего уровня и на все текущие файлы задачи.
Подготовь компонент к работе на уровне ${level.number}, сохранив полезные наработки и обновив реализацию там, где это требуется новой дидактикой уровня.

КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}

Верни полный набор файлов по ключам:
${JSON.stringify(fileList, null, 2)}

ТЕКУЩЕЕ СОСТОЯНИЕ ВСЕХ ФАЙЛОВ:
${filesText}
`.trim()
    : `
${prod}

${did}

${levelDidactic}

${levelInitPrompt}

ОБЩЕЕ ПОЯСНЕНИЕ УРОВНЯ:
${labContext.commonExplanation}

УНИКАЛЬНОЕ ПОЯСНЕНИЕ ЭТОЙ ЗАДАЧИ:
${labContext.taskExplanation}

ЗАДАНИЕ:
По картинкам текущего уровня создай первичную реализацию набора файлов компонента.

КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}

Ключи результата соответствуют fileId из списка:
${JSON.stringify(fileList, null, 2)}
`.trim()

  let outputText = ""
  try {
    const result = await runStructuredLlmRequest({
      target: "init",
      instruction,
      imageBase64List,
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
    console.log("[desengine][task-start] llm_response_received", {
      taskId,
      provider: result.provider,
      model: result.model,
      outputTextLength: result.outputText.length,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    const response = toLlmErrorResponse(error)
    console.error("[desengine][task-start] llm_request_failed", {
      taskId,
      durationMs: Date.now() - startedAt,
      status: response.status,
      body: response.body,
    })
    return Response.json(response.body, { status: response.status })
  }

  let payload: FilesPayload
  try {
    const parsed = extractJson(outputText)
    if (!parsed || typeof parsed !== "object") throw new Error("Ответ не является JSON-объектом")
    payload = parsed as FilesPayload
  } catch (error) {
    console.error("[desengine][task-start] parse_failed", {
      taskId,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
      outputTextPreview: outputText.slice(0, 800),
      outputTextLength: outputText.length,
    })
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
    outputFiles.map((f) => [f.id, f.fileName] as const),
  )
  const writtenFiles: string[] = []

  for (const [fileId, content] of Object.entries(payload)) {
    const fileName = editable.get(fileId)
    if (!fileName) continue
    const filePath = path.join(appConfig.tasksRoot, taskId, fileName)
    await writeFile(filePath, String(content ?? ""), "utf-8")
    writtenFiles.push(filePath)
  }

  console.log("[desengine][task-start] files_written", {
    taskId,
    writtenFiles,
    durationMs: Date.now() - startedAt,
  })

  const progress = await markCurrentTaskLevelInitialized(taskId)
  const nextTaskItem = await getTaskListItemById(taskId)
  const nextLabContext = nextTaskItem ? await getTaskLabContext(nextTaskItem) : null
  const nextTaskData = await readTaskData({ id: taskId }, nextLabContext)
  console.log("[desengine][task-start] success", {
    taskId,
    writtenFileCount: writtenFiles.length,
    durationMs: Date.now() - startedAt,
  })
  return Response.json({
    ok: true,
    taskData: nextTaskData,
    taskItem: nextTaskItem ? { ...nextTaskItem, progress } : { ...taskItem, progress },
    level,
  })
}
