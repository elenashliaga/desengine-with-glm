import { readFile, writeFile } from "node:fs/promises"

import {
  appendPromptHistory,
  cleanupForbiddenWorkbenchFiles,
  filterWorkbenchPayloadByAllowlist,
  getLevelForTaskItem,
  getTaskLabContext,
  getLevelEditableWorkbenchFiles,
  getTaskListItemById,
  isTaskStarted,
  readTaskData,
  registerPromptForCurrentLevel,
} from "@/lib/server"
import { appConfig } from "@/lib/config.server"
import { runStructuredLlmRequest, toLlmErrorResponse } from "@/lib/llm.server"
import { readLevelDidacticPrompt, readPrompt } from "@/lib/prompts.server"
import {
  ensureUserTaskDir,
  getTaskCatalogFilePath,
  getUserTaskFilePath,
} from "@/lib/user-state.server"
import { validateGeneratedFilesPayload } from "@/lib/workbench-output.server"

type Params = { taskId: string }

type Body = {
  prompt?: string
  selectedFileIds?: string[]
}

type FilesPayload = Record<string, string | null>

function extractJson(text: string): unknown {
  const trimmed = (text || "").trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : trimmed

  return JSON.parse(candidate)
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

  const started = await isTaskStarted(taskId)
  if (!started) {
    return Response.json({ ok: false, error: "Сначала запустите задачу" }, { status: 400 })
  }

  const taskItem = await getTaskListItemById(taskId)
  if (!taskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  if (taskItem.progress.currentLevelStatus === "completed") {
    return Response.json({ ok: false, error: "Текущий уровень уже завершён" }, { status: 409 })
  }

  if (!taskItem.progress.currentLevelInitialized) {
    return Response.json({ ok: false, error: "Сначала дождитесь инициирующего запуска текущего уровня" }, { status: 409 })
  }

  if (taskItem.progress.promptsUsed >= taskItem.progress.promptsLimit) {
    return Response.json({ ok: false, error: "Лимит промптов для уровня уже исчерпан" }, { status: 409 })
  }

  const labContext = await getTaskLabContext(taskItem)
  const cleanupBeforeIteration = await cleanupForbiddenWorkbenchFiles(taskId, labContext.editableFileIds)
  const promptImages = labContext.images.filter((image) => image.show)
  if (promptImages.length === 0) {
    return Response.json({ ok: false, error: "Для уровня не настроены картинки для LLM-контекста" }, { status: 400 })
  }

  const editableFiles = getLevelEditableWorkbenchFiles(labContext.editableFileIds)
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

  const level = await getLevelForTaskItem(taskItem)
  const taskData = await readTaskData(taskItem, labContext)
  const [productionPrompt, levelDidacticPrompt] = await Promise.all([
    readPrompt("production", "iterate-component"),
    readLevelDidacticPrompt(level.promptKey),
  ])

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
    return Response.json({ ok: false, error: "Не найдены обязательные картинки текущего уровня" }, { status: 404 })
  }

  const selectedFiles = selectedFileIds.map((fileId) => {
    const file = editableById.get(fileId)
    return {
      id: fileId,
      fileName: file?.fileName || fileId,
      content: taskData.contentByFileId[fileId] ?? "",
    }
  })

  const selectedFilesText = selectedFiles
    .map((file) => `FILE ${file.id} (${file.fileName})\n\`\`\`tsx\n${file.content}\n\`\`\``)
    .join("\n\n")

  const imagesText = promptImages
    .map((image) => `- ${image.id}.png — ${image.width}x${image.height}`)
    .join("\n")
  const allowedFilesText = editableFiles
    .map((file) => `- ${file.id} — ${file.fileName}`)
    .join("\n")

  const instruction = `
${productionPrompt}

${levelDidacticPrompt}

## Разрешённые файлы
${allowedFilesText}

Верни JSON только с ключами из этого списка:
${allowedFilesText}

Если какой-то файл не нужно менять, верни для него null.

ТЕКУЩИЙ УТОЧНЯЮЩИЙ ПРОМПТ ПОЛЬЗОВАТЕЛЯ:
${promptText}

КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}

В КОНТЕКСТ ЭТОЙ ИТЕРАЦИИ ВКЛЮЧЕНЫ ТОЛЬКО СЛЕДУЮЩИЕ ФАЙЛЫ:
${selectedFilesText}
`.trim()

  let outputText = ""
  let llmCall: Awaited<ReturnType<typeof runStructuredLlmRequest>>
  try {
    llmCall = await runStructuredLlmRequest({
      instruction,
      imageBase64List,
      schemaName: "desengine_iterate_component_files",
      schema: {
        type: "object",
        additionalProperties: false,
        required: editableFiles.map((file) => file.id),
        properties: Object.fromEntries(
          editableFiles.map((file) => [file.id, { type: ["string", "null"] }]),
        ),
      },
    })
    outputText = llmCall.outputText
  } catch (error) {
    const response = toLlmErrorResponse(error)
    return Response.json(response.body, { status: response.status })
  }

  let payload: FilesPayload
  try {
    const parsed = extractJson(outputText)
    if (!parsed || typeof parsed !== "object") throw new Error("Ответ не является JSON-объектом")
    payload = parsed as FilesPayload
    validateGeneratedFilesPayload(
      payload,
      editableFiles.map((file) => ({ id: file.id, fileName: file.fileName })),
      appConfig.taskWorkbenchFiles,
      { allowNull: true },
    )
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось разобрать ответ",
      },
      { status: 500 },
    )
  }

  const changedFileIds: string[] = []
  const filteredPayload = filterWorkbenchPayloadByAllowlist(payload, labContext.editableFileIds)
  await ensureUserTaskDir(taskId)

  for (const entry of filteredPayload.allowedEntries) {
    if (typeof entry.content !== "string") continue

    const filePath = getUserTaskFilePath(taskId, entry.fileName)
    await writeFile(filePath, entry.content, "utf-8")
    changedFileIds.push(entry.fileId)
  }

  const cleanupAfterIteration = await cleanupForbiddenWorkbenchFiles(taskId, labContext.editableFileIds)

  await appendPromptHistory(taskId, {
    text: promptText,
    createdAt: new Date().toISOString(),
    selectedFileIds,
    levelNumber: taskItem.progress.currentLevel,
    changedFileIds,
    llmCall: {
      provider: llmCall.provider,
      model: llmCall.model,
      metrics: llmCall.metrics,
    },
  })

  if (filteredPayload.ignoredFileIds.length > 0 || cleanupBeforeIteration.deletedFileIds.length > 0 || cleanupAfterIteration.deletedFileIds.length > 0) {
    console.log("[desengine][task-iterate] allowlist_enforced", {
      taskId,
      ignoredFileIds: filteredPayload.ignoredFileIds,
      deletedBeforeIterationFileIds: cleanupBeforeIteration.deletedFileIds,
      deletedAfterIterationFileIds: cleanupAfterIteration.deletedFileIds,
    })
  }

  const progressUpdate = await registerPromptForCurrentLevel(taskId)
  const nextTaskItem = await getTaskListItemById(taskId)
  const nextLabContext = nextTaskItem ? await getTaskLabContext(nextTaskItem) : null
  const nextTaskData = await readTaskData({ id: taskId }, nextLabContext)
  return Response.json({
    ok: true,
    taskData: nextTaskData,
    taskItem: nextTaskItem ? { ...nextTaskItem, progress: progressUpdate.summary } : null,
    transition: progressUpdate.transition,
  })
}
