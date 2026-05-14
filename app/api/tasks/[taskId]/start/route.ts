import { readFile, writeFile } from "node:fs/promises"

import {
  clearTaskCheckResult,
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
} from "@/lib/platform/server"
import { requireAccessOrUnauthorizedResponse } from "@/lib/access/server"
import { appConfig } from "@/lib/config/server"
import { runStructuredLlmRequest, toLlmErrorResponse } from "@/lib/llm/server"
import { readLevelIteratePrompt, readLevelStartPrompt, readPrompt } from "@/lib/prompt/server"
import {
  ensureUserTaskDir,
  getTaskCatalogFilePath,
  getUserTaskFilePath,
} from "@/lib/user/server"
import { validateGeneratedFilesPayload } from "@/lib/lab/workbench"

type Params = { taskId: string }

type FilesPayload = Record<string, string>

const blankStartFallbackByFileName: Record<string, string> = {
  "styles.ts": "export {};",
  "mock.ts": "export const mock = {};",
  "props.ts": "export {};",
}

type OutputFile = {
  id: string
  fileName: string
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

function formatAllowedFilesText(files: OutputFile[]) {
  return files.map((file) => `- ${file.id} — ${file.fileName}`).join("\n")
}

function getRelevantCurrentFiles(files: OutputFile[], contentByFileId: Record<string, string>) {
  return files
    .map((file) => ({
      ...file,
      content: contentByFileId[file.id] ?? "",
    }))
    .filter((file) => file.content.trim().length > 0)
}

function formatFilesContextText(files: Array<OutputFile & { content: string }>) {
  return files
    .map((file) => `FILE ${file.id} (${file.fileName})\n\`\`\`tsx\n${file.content}\n\`\`\``)
    .join("\n\n")
}

function buildStartInstruction({
  already,
  productionPrompt,
  defaultDidacticPrompt,
  levelIteratePrompt,
  levelStartPrompt,
  levelNumber,
  imagesText,
  allowedFilesText,
  relevantCurrentFilesText,
}: {
  already: boolean
  productionPrompt: string
  defaultDidacticPrompt: string
  levelIteratePrompt: string
  levelStartPrompt: string
  levelNumber: number
  imagesText: string
  allowedFilesText: string
  relevantCurrentFilesText: string
}) {
  const sections = [
    productionPrompt,
    defaultDidacticPrompt,
    levelIteratePrompt,
    levelStartPrompt,
    already
      ? `
ЗАДАНИЕ:
Это initiator-запуск нового уровня для уже существующей задачи.
Посмотри на картинки текущего уровня и сохрани полезные рабочие наработки только там, где они помогают уровню ${levelNumber}.
Если какого-то файла ещё нет в текущем состоянии, это нормально: ты можешь создать его с нуля.
`
      : `
ЗАДАНИЕ:
По картинкам текущего уровня создай первую рабочую реализацию набора файлов компонента.
Если какого-то файла пока нет, просто создай его с нуля.
`,
    `
КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}
`,
    `
## Разрешённые файлы результата
${allowedFilesText}

Верни полный набор файлов строго по этим ключам:
${allowedFilesText}

Значение каждого ключа должно быть полным текстовым содержимым соответствующего файла.
Нельзя возвращать имя файла, fileId, короткую заглушку или пояснение вместо кода.
`,
    already && relevantCurrentFilesText
      ? `
ТЕКУЩИЙ ПОЛЕЗНЫЙ КОНТЕКСТ ИЗ УЖЕ СУЩЕСТВУЮЩИХ ФАЙЛОВ:
${relevantCurrentFilesText}
`
      : "",
  ]

  return sections
    .map((section) => section.trim())
    .filter(Boolean)
    .join("\n\n")
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

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

  if (already && taskItem.progress.currentLevelStarted) {
    await clearTaskCheckResult(taskId)
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

  const [startProd, did, levelSpecifyPrompt, levelInitPrompt, taskData] = await Promise.all([
    readPrompt("production", "start-component"),
    readPrompt("didactic", "default"),
    readLevelIteratePrompt(level.id),
    readLevelStartPrompt(level.id),
    readTaskData(taskItem, labContext),
  ])

  const outputFiles = levelEditableFiles
  const fileList = outputFiles.map((f) => ({ id: f.id, fileName: f.fileName }))
  const allowedFilesText = formatAllowedFilesText(fileList)
  const relevantCurrentFiles = getRelevantCurrentFiles(outputFiles, taskData.contentByFileId)
  const relevantCurrentFilesText = formatFilesContextText(relevantCurrentFiles)
  const imagesText = promptImages.map((image) => `- ${image.id}.png — ${image.width}x${image.height}`).join("\n")

  const instruction = buildStartInstruction({
    already,
    productionPrompt: startProd,
    defaultDidacticPrompt: did,
    levelIteratePrompt: levelSpecifyPrompt,
    levelStartPrompt: levelInitPrompt,
    levelNumber: level.number,
    imagesText,
    allowedFilesText,
    relevantCurrentFilesText,
  })

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

  const filteredPayload = filterWorkbenchPayloadByAllowlist(payload, labContext.editableFileIds)
  const writtenFiles: string[] = []
  let cleanup = {
    deletedFileIds: [] as string[],
    deletedFilePaths: [] as string[],
  }

  try {
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

    cleanup = await cleanupForbiddenWorkbenchFiles(taskId, labContext.editableFileIds)
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
  } catch (error) {
    console.error("[desengine][task-start] write_error", {
      taskId,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
      writtenFiles,
      ignoredFileIds: filteredPayload.ignoredFileIds,
      deletedFileIds: cleanup.deletedFileIds,
      outcome: "write_error",
    })
    return Response.json(
      {
        ok: false,
        error: "Не удалось сохранить результат initiator-запуска. Повторите попытку.",
        errorKind: "write_error",
      },
      { status: 500 },
    )
  }

  await clearTaskCheckResult(taskId)
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
