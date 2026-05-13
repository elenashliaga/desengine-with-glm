import { readFile, writeFile } from "node:fs/promises"

import { appConfig } from "@/lib/config/config.server"
import { TEACHING_COST_PER_ITERATION_CENTS } from "@/lib/task/prompt-history"
import { getLevelEditableWorkbenchFiles } from "@/lib/task/task-workbench.server"
import {
  type TaskLabContext,
  type PromptHistoryEntry,
  type TaskData,
  type TaskLlmUsageSummary,
} from "@/lib/platform/types"
import {
  ensureParentDir,
  getUserTaskFilePath,
  pathExists,
  promptHistoryFileName,
} from "@/lib/platform/user-state.server"

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

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
    teachingCostCents: promptHistory.length * TEACHING_COST_PER_ITERATION_CENTS,
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
    if (file.fileName.toLowerCase().endsWith(".png")) {
      return false
    }

    if (!file.edit || !levelEditableFileIds) {
      return true
    }

    return levelEditableFileIds.has(file.id)
  })

  const entries = await Promise.all(
    textFiles.map(async (file) => {
      const filePath = getUserTaskFilePath(task.id, file.fileName)
      const content = await readFile(filePath, "utf-8").catch(() => "")
      return [file.id, content] as const
    }),
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
        isStringArray(maybeLegacyEntry.selectedFileIds)

      return (
        typeof maybeLegacyEntry.text === "string" &&
        typeof maybeLegacyEntry.createdAt === "string" &&
        (typeof maybeLegacyEntry.displayCreatedAt === "string" || typeof maybeLegacyEntry.displayCreatedAt === "undefined") &&
        (typeof maybeLegacyEntry.iterationNumber === "number" || typeof maybeLegacyEntry.iterationNumber === "undefined") &&
        (typeof maybeLegacyEntry.levelNumber === "number" || typeof maybeLegacyEntry.levelNumber === "undefined") &&
        (typeof maybeLegacyEntry.selectedFileNames === "undefined" || isStringArray(maybeLegacyEntry.selectedFileNames)) &&
        hasLegacySelectedFileIds &&
        (typeof maybeLegacyEntry.changedFileIds === "undefined" || isStringArray(maybeLegacyEntry.changedFileIds)) &&
        (typeof maybeLegacyEntry.changedFileNames === "undefined" || isStringArray(maybeLegacyEntry.changedFileNames)) &&
        (typeof maybeLegacyEntry.teachingCostCents === "number" || typeof maybeLegacyEntry.teachingCostCents === "undefined")
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
