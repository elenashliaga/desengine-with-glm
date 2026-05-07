import { readFile, writeFile } from "node:fs/promises"

import {
  cleanupForbiddenWorkbenchFiles,
  filterWorkbenchPayloadByAllowlist,
  getLevelForTaskItem,
  getLevelEditableWorkbenchFiles,
  getTaskLabContext,
  getTaskListItemById,
  isTaskStarted,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  readTaskData,
} from "@/lib/server"
import { appConfig } from "@/lib/config.server"
import { runStructuredLlmRequest, toLlmErrorResponse } from "@/lib/llm.server"
import { readLevelIteratePrompt, readLevelStartPrompt, readPrompt } from "@/lib/prompts.server"
import {
  ensureUserTaskDir,
  getTaskCatalogFilePath,
  getUserTaskFilePath,
} from "@/lib/user-state.server"
import { validateGeneratedFilesPayload } from "@/lib/workbench-output.server"

type Params = { taskId: string }

type FilesPayload = Record<string, string>

const blankStartFallbackByFileName: Record<string, string> = {
  "styles.ts": "export {};",
  "mock.ts": "export const mock = {};",
  "props.ts": "export {};",
}

function extractJson(text: string): unknown {
  const trimmed = (text || "").trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : trimmed

  return JSON.parse(candidate)
}

function normalizeStartPayload(
  payload: FilesPayload,
  outputFiles: { id: string; fileName: string }[],
  currentContentByFileId: Record<string, string>,
): FilesPayload {
  const normalizedEntries = outputFiles.map((file) => {
    const rawContent = payload[file.id]

    if (typeof rawContent !== "string") {
      return [file.id, rawContent] as const
    }

    if (rawContent.trim()) {
      return [file.id, rawContent] as const
    }

    const existingContent = currentContentByFileId[file.id]?.trim()
    if (existingContent) {
      return [file.id, currentContentByFileId[file.id]] as const
    }

    return [file.id, blankStartFallbackByFileName[file.fileName] ?? rawContent] as const
  })

  return Object.fromEntries(normalizedEntries)
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
  const levelEditableFiles = getLevelEditableWorkbenchFiles(labContext.editableFileIds)

  if (already && taskItem.progress.currentLevelInitialized) {
    const cleanup = await cleanupForbiddenWorkbenchFiles(taskId, labContext.editableFileIds)
    if (cleanup.deletedFileIds.length > 0) {
      console.log("[desengine][task-start] forbidden_files_deleted", {
        taskId,
        deletedFileIds: cleanup.deletedFileIds,
        deletedFilePaths: cleanup.deletedFilePaths,
      })
    }

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
        const imagePath = getTaskCatalogFilePath(taskId, `${image.id}.png`)
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

  const [prod, did, levelSpecifyPrompt, levelInitPrompt, taskData] = await Promise.all([
    readPrompt("production", "default"),
    readPrompt("didactic", "default"),
    readLevelIteratePrompt(level.id),
    readLevelStartPrompt(level.id),
    readTaskData(taskItem, labContext),
  ])

  const outputFiles = levelEditableFiles
  const fileList = outputFiles.map((f) => ({ id: f.id, fileName: f.fileName }))
  const allowedFilesText = fileList
    .map((file) => `- ${file.id} — ${file.fileName}`)
    .join("\n")
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

${levelSpecifyPrompt}

${levelInitPrompt}

ОБЩЕЕ ПОЯСНЕНИЕ УРОВНЯ:
${labContext.commonExplanation}

УНИКАЛЬНОЕ ПОЯСНЕНИЕ ЭТОЙ ЗАДАЧИ:
${labContext.taskExplanation}

ЗАДАНИЕ:
Это инициирующий запуск нового уровня для уже существующей задачи.
Посмотри на картинки текущего уровня и на все разрешённые рабочие файлы задачи.
Подготовь компонент к работе на уровне ${level.number}, сохранив полезные наработки и обновив реализацию там, где это требуется новой дидактикой уровня.

КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}

## Разрешённые файлы
${allowedFilesText}

Верни полный набор файлов по ключам:
${allowedFilesText}

Значение каждого ключа должно быть полным текстовым содержимым соответствующего файла.
Нельзя возвращать имя файла, fileId, короткую заглушку или пояснение вместо кода.

ТЕКУЩЕЕ СОСТОЯНИЕ РАЗРЕШЁННЫХ РАБОЧИХ ФАЙЛОВ:
${filesText}
`.trim()
    : `
${prod}

${did}

${levelSpecifyPrompt}

${levelInitPrompt}

ОБЩЕЕ ПОЯСНЕНИЕ УРОВНЯ:
${labContext.commonExplanation}

УНИКАЛЬНОЕ ПОЯСНЕНИЕ ЭТОЙ ЗАДАЧИ:
${labContext.taskExplanation}

ЗАДАНИЕ:
По картинкам текущего уровня создай первичную реализацию набора файлов компонента.

КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}

## Разрешённые файлы
${allowedFilesText}

Ключи результата соответствуют fileId из списка:
${allowedFilesText}

Значение каждого ключа должно быть полным текстовым содержимым соответствующего файла.
Нельзя возвращать имя файла, fileId, короткую заглушку или пояснение вместо кода.
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
        required: outputFiles.map((file) => file.id),
        properties: Object.fromEntries(
          outputFiles.map((file) => [file.id, { type: "string" }]),
        ),
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
    payload = normalizeStartPayload(parsed as FilesPayload, fileList, taskData.contentByFileId)
    validateGeneratedFilesPayload(payload, fileList, appConfig.taskWorkbenchFiles, {
      allowBlankFileNames: Object.keys(blankStartFallbackByFileName),
    })
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

  const writtenFiles: string[] = []
  const filteredPayload = filterWorkbenchPayloadByAllowlist(payload, labContext.editableFileIds)
  await ensureUserTaskDir(taskId)

  for (const entry of filteredPayload.allowedEntries) {
    const filePath = getUserTaskFilePath(taskId, entry.fileName)
    await writeFile(filePath, String(entry.content ?? ""), "utf-8")
    writtenFiles.push(filePath)
  }

  if (filteredPayload.ignoredFileIds.length > 0) {
    console.log("[desengine][task-start] forbidden_payload_ignored", {
      taskId,
      ignoredFileIds: filteredPayload.ignoredFileIds,
    })
  }

  const cleanup = await cleanupForbiddenWorkbenchFiles(taskId, labContext.editableFileIds)
  if (cleanup.deletedFileIds.length > 0) {
    console.log("[desengine][task-start] forbidden_files_deleted", {
      taskId,
      deletedFileIds: cleanup.deletedFileIds,
      deletedFilePaths: cleanup.deletedFilePaths,
    })
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
    ignoredFileIds: filteredPayload.ignoredFileIds,
    deletedFileIds: cleanup.deletedFileIds,
    durationMs: Date.now() - startedAt,
  })
  return Response.json({
    ok: true,
    taskData: nextTaskData,
    taskItem: nextTaskItem ? { ...nextTaskItem, progress } : { ...taskItem, progress },
    level,
  })
}
