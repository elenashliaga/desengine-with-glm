import { readFile, writeFile } from "node:fs/promises"

import { appConfig } from "./config.server"
import { getLevelEditableWorkbenchFiles } from "./task-workbench.server"
import {
  type TaskLabContext,
  type PromptHistoryEntry,
  type TaskData,
  type TaskLlmUsageSummary,
} from "./types"
import {
  ensureParentDir,
  getUserTaskFilePath,
  pathExists,
  promptHistoryFileName,
} from "./user-state.server"

const teachingCostPerIterationCents = 3

function buildTaskLlmUsageSummary(promptHistory: PromptHistoryEntry[]): TaskLlmUsageSummary {
  const providersUsed = new Set<string>()
  let inputTokensTotal = 0
  let outputTokensTotal = 0
  let totalTokensTotal = 0
  let hasInputTokens = false
  let hasOutputTokens = false
  let hasTotalTokens = false
  let callsWithoutProviderMetrics = 0

  for (const entry of promptHistory) {
    if (!entry.llmCall) continue

    providersUsed.add(entry.llmCall.provider)

    if (entry.llmCall.metrics.status !== "available") {
      callsWithoutProviderMetrics += 1
      continue
    }

    if (typeof entry.llmCall.metrics.inputTokens === "number") {
      inputTokensTotal += entry.llmCall.metrics.inputTokens
      hasInputTokens = true
    }

    if (typeof entry.llmCall.metrics.outputTokens === "number") {
      outputTokensTotal += entry.llmCall.metrics.outputTokens
      hasOutputTokens = true
    }

    if (typeof entry.llmCall.metrics.totalTokens === "number") {
      totalTokensTotal += entry.llmCall.metrics.totalTokens
      hasTotalTokens = true
    }
  }

  return {
    totalCalls: promptHistory.length,
    teachingCostCents: promptHistory.length * teachingCostPerIterationCents,
    providersUsed: [...providersUsed],
    inputTokens: hasInputTokens ? inputTokensTotal : null,
    outputTokens: hasOutputTokens ? outputTokensTotal : null,
    totalTokens: hasTotalTokens ? totalTokensTotal : null,
    callsWithoutProviderMetrics,
  }
}

export async function readTaskData(
  task: { id: string },
  labContext: TaskLabContext | null = null,
): Promise<TaskData> {
  const levelEditableFileIds = labContext
    ? new Set(getLevelEditableWorkbenchFiles(labContext.editableFileIds).map((file) => file.id))
    : null

  const textFiles = appConfig.taskWorkbenchFiles.filter((file) => {
    // На MVP не читаем бинарные файлы (PNG).
    if (file.fileName.toLowerCase().endsWith(".png")) {
      return false
    }

    if (!file.edit || !levelEditableFileIds) {
      return true
    }

    return levelEditableFileIds.has(file.id)
  })

  const entries = await Promise.all(
    // для каждого файла собрать путь
    // по пути прочитать контент
    // и вернуть пару «id файла, контент»
    textFiles.map(async (file) => {
      const filePath = getUserTaskFilePath(task.id, file.fileName)

      const content = await readFile(filePath, "utf-8").catch(() => "")

      return [file.id, content] as const
    })
  )

  const promptHistory = await readPromptHistory(task.id)

  return {
    taskId: task.id,
    contentByFileId: Object.fromEntries(entries),
    promptHistory,
    llmUsageSummary: buildTaskLlmUsageSummary(promptHistory),
    labContext,
  }
}

export async function isTaskStarted(taskId: string): Promise<boolean> {
  const componentFile = appConfig.taskWorkbenchFiles.find((f) => f.id === "component")
  if (!componentFile) return false

  return pathExists(getUserTaskFilePath(taskId, componentFile.fileName))
}

function getPromptHistoryPath(taskId: string) {
  return getUserTaskFilePath(taskId, promptHistoryFileName)
}

export async function readPromptHistory(taskId: string): Promise<PromptHistoryEntry[]> {
  const filePath = getPromptHistoryPath(taskId)

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is PromptHistoryEntry => {
      if (!entry || typeof entry !== "object") return false

      const maybeLegacyEntry = entry as PromptHistoryEntry & { selectedFileIds?: unknown }
      const hasLegacySelectedFileIds =
        typeof maybeLegacyEntry.selectedFileIds === "undefined" ||
        (Array.isArray(maybeLegacyEntry.selectedFileIds) &&
          maybeLegacyEntry.selectedFileIds.every((item: unknown) => typeof item === "string"))

      return (
        typeof maybeLegacyEntry.text === "string" &&
        typeof maybeLegacyEntry.createdAt === "string" &&
        (typeof maybeLegacyEntry.levelNumber === "number" || typeof maybeLegacyEntry.levelNumber === "undefined") &&
        hasLegacySelectedFileIds
      )
    })
  } catch {
    return []
  }
}

export async function appendPromptHistory(taskId: string, entry: PromptHistoryEntry) {
  const history = await readPromptHistory(taskId)
  history.push(entry)
  const filePath = getPromptHistoryPath(taskId)
  await ensureParentDir(filePath)
  await writeFile(filePath, JSON.stringify(history, null, 2), "utf-8")
}
