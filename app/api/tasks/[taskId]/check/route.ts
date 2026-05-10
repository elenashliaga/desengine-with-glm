import { readFile } from "node:fs/promises"

import {
  clearTaskCheckResult,
  failCurrentTaskLevelCheck,
  getLevelEditableWorkbenchFiles,
  getLevelForTaskItem,
  getTaskLabContext,
  getTaskListItemById,
  isTaskStarted,
  markCurrentTaskLevelCheckTechnicalError,
  passCurrentTaskLevelCheck,
  readTaskData,
  saveTaskCheckResult,
} from "@/lib/server"
import { runStructuredLlmRequest } from "@/lib/llm.server"
import { readLevelCheckPrompt, readPrompt } from "@/lib/prompts.server"
import { getTaskCatalogFilePath } from "@/lib/user-state.server"
import type { TaskCheckResult, TaskData, TaskListItem } from "@/lib/types"

type Params = { taskId: string }

function createEmptyTaskData(taskId: string, labContext: Awaited<ReturnType<typeof getTaskLabContext>>): TaskData {
  return {
    taskId,
    contentByFileId: {},
    promptHistory: [],
    llmUsageSummary: {
      totalCalls: 0,
      teachingCostCents: 0,
      providersUsed: [],
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      callsWithoutProviderMetrics: 0,
    },
    labContext,
  }
}

function buildTechnicalErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return `Проверка уровня временно недоступна: ${error.message}`
  }

  return "Проверка уровня временно недоступна. Повторите попытку ещё раз."
}

async function buildTaskResponse(taskId: string, taskItem: TaskListItem) {
  const started = await isTaskStarted(taskId)
  const labContext = await getTaskLabContext(taskItem)

  return {
    started,
    taskData: started
      ? await readTaskData(taskItem, labContext)
      : createEmptyTaskData(taskId, labContext),
  }
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

  const started = await isTaskStarted(taskId)
  if (!started) {
    return Response.json({ ok: false, error: "Сначала запустите задачу" }, { status: 409 })
  }

  if (!taskItem.progress.currentLevelInitialized) {
    return Response.json(
      { ok: false, error: "Сначала дождитесь инициирующего запуска текущего уровня" },
      { status: 409 },
    )
  }

  if (taskItem.progress.currentLevelStatus === "completed") {
    return Response.json({ ok: false, error: "Текущий уровень уже завершён" }, { status: 409 })
  }

  const level = await getLevelForTaskItem(taskItem)
  const labContext = await getTaskLabContext(taskItem)
  const promptImages = labContext.images.filter((image) => image.show)
  if (promptImages.length === 0) {
    return Response.json({ ok: false, error: "Для уровня не настроены картинки для проверки" }, { status: 400 })
  }

  const editableFiles = getLevelEditableWorkbenchFiles(labContext.editableFileIds)
  if (editableFiles.length === 0) {
    return Response.json({ ok: false, error: "Для уровня не настроены доступные рабочие файлы" }, { status: 400 })
  }

  const taskData = await readTaskData(taskItem, labContext)
  const [defaultProductionPrompt, defaultDidacticPrompt, levelCheckPrompt] = await Promise.all([
    readPrompt("production", "default"),
    readPrompt("didactic", "default"),
    readLevelCheckPrompt(level.id),
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

  const allowedFilesText = editableFiles
    .map((file) => `- ${file.id} — ${file.fileName}`)
    .join("\n")
  const selectedFilesText = editableFiles
    .map((file) => `FILE ${file.id} (${file.fileName})\n\`\`\`tsx\n${taskData.contentByFileId[file.id] ?? ""}\n\`\`\``)
    .join("\n\n")
  const imagesText = promptImages
    .map((image) => `- ${image.id}.png — ${image.width}x${image.height}`)
    .join("\n")

  const instruction = `
${defaultProductionPrompt}

${defaultDidacticPrompt}

${levelCheckPrompt}

ОБЩЕЕ ПОЯСНЕНИЕ УРОВНЯ:
${labContext.commonExplanation}

ПРОВЕРЬ РЕЗУЛЬТАТ ТЕКУЩЕГО УРОВНЯ.
Используй только содержательный итог.

Верни JSON со строгой схемой:
- \`passed\`: boolean
- \`message\`: string

\`message\` должно быть кратким, понятным пользователю и на русском языке.

РАЗРЕШЁННЫЕ РАБОЧИЕ ФАЙЛЫ:
${allowedFilesText}

КАРТИНКИ ТЕКУЩЕГО УРОВНЯ:
${imagesText}

ТЕКУЩЕЕ СОСТОЯНИЕ РАБОЧИХ ФАЙЛОВ:
${selectedFilesText}
`.trim()

  let checkResponse: { passed: boolean; message: string }
  try {
    const llmCall = await runStructuredLlmRequest({
      target: "check",
      instruction,
      imageBase64List,
      schemaName: "desengine_check_level_result",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["passed", "message"],
        properties: {
          passed: { type: "boolean" },
          message: { type: "string", minLength: 1 },
        },
      },
    })

    const parsed = JSON.parse(llmCall.outputText)
    if (
      !parsed
      || typeof parsed !== "object"
      || typeof parsed.passed !== "boolean"
      || typeof parsed.message !== "string"
      || !parsed.message.trim()
    ) {
      throw new Error("Проверка уровня вернула невалидный structured-ответ")
    }

    checkResponse = {
      passed: parsed.passed,
      message: parsed.message.trim(),
    }
  } catch (error) {
    const progress = await markCurrentTaskLevelCheckTechnicalError(taskId)
    const result: TaskCheckResult = {
      taskId,
      levelId: level.id,
      levelNumber: level.number,
      levelTitle: level.title,
      attemptNumber: taskItem.progress.checkAttemptsUsed + 1,
      maxCheckAttempts: level.maxCheckAttempts,
      passed: false,
      message: buildTechnicalErrorMessage(error),
      kind: "technical_error",
      createdAt: new Date().toISOString(),
    }

    await saveTaskCheckResult(result)

    const nextTaskItem = await getTaskListItemById(taskId)
    if (!nextTaskItem) {
      return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
    }

    const taskResponse = await buildTaskResponse(taskId, {
      ...nextTaskItem,
      progress,
    })

    return Response.json({
      ok: true,
      taskItem: { ...nextTaskItem, progress },
      taskData: taskResponse.taskData,
      started: taskResponse.started,
      checkResult: result,
      transition: null,
    })
  }

  await clearTaskCheckResult(taskId)

  if (checkResponse.passed) {
    const progressUpdate = await passCurrentTaskLevelCheck(taskId)
    const result: TaskCheckResult = {
      taskId,
      levelId: level.id,
      levelNumber: level.number,
      levelTitle: level.title,
      attemptNumber: progressUpdate.attemptNumber,
      maxCheckAttempts: progressUpdate.maxCheckAttempts,
      passed: true,
      message: checkResponse.message,
      kind: "passed",
      createdAt: new Date().toISOString(),
    }

    await saveTaskCheckResult(result)

    const nextTaskItem = await getTaskListItemById(taskId)
    if (!nextTaskItem) {
      return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
    }

    const taskResponse = await buildTaskResponse(taskId, {
      ...nextTaskItem,
      progress: progressUpdate.summary,
    })

    return Response.json({
      ok: true,
      taskItem: { ...nextTaskItem, progress: progressUpdate.summary },
      taskData: taskResponse.taskData,
      started: taskResponse.started,
      checkResult: result,
      transition: progressUpdate.transition,
    })
  }

  const failureUpdate = await failCurrentTaskLevelCheck(taskId)
  const result: TaskCheckResult = {
    taskId,
    levelId: level.id,
    levelNumber: level.number,
    levelTitle: level.title,
    attemptNumber: failureUpdate.attemptNumber,
    maxCheckAttempts: failureUpdate.maxCheckAttempts,
    passed: false,
    message: checkResponse.message,
    kind: failureUpdate.reset ? "failed_and_reset" : "failed",
    createdAt: new Date().toISOString(),
  }

  await saveTaskCheckResult(result)

  const nextTaskItem = await getTaskListItemById(taskId)
  if (!nextTaskItem) {
    return Response.json({ ok: false, error: "Задание не найдено" }, { status: 404 })
  }

  const taskResponse = await buildTaskResponse(taskId, failureUpdate.summary
    ? { ...nextTaskItem, progress: failureUpdate.summary }
    : nextTaskItem)

  return Response.json({
    ok: true,
    taskItem: failureUpdate.summary
      ? { ...nextTaskItem, progress: failureUpdate.summary }
      : nextTaskItem,
    taskData: taskResponse.taskData,
    started: taskResponse.started,
    checkResult: result,
    transition: null,
  })
}
