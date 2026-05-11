import "server-only"

import { randomUUID } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"

import { appConfig } from "./config.server"
import { createSnapshotPath } from "./navigation"
import { readPromptHistory } from "./repository"
import {
  PublishedSnapshotSchema,
  type PromptHistoryEntry,
  type PublishedSnapshot,
  type SnapshotFileEntry,
  type SnapshotPromptEntry,
} from "./types"
import {
  ensureUserSnapshotsDir,
  getSnapshotFilePath,
  getUserTaskFilePath,
  pathExists,
} from "./user-state.server"

type SnapshotSecretViolation = {
  sourceType: "file" | "prompt"
  sourceLabel: string
  ruleId: string
}

const SNAPSHOT_VERSION = 1 as const

const secretDetectors: Array<{
  id: string
  pattern: RegExp
}> = [
  {
    id: "openai-api-key",
    pattern: /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{16,}\b/,
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/i,
  },
  {
    id: "bearer-token",
    pattern: /\bauthorization\s*:\s*bearer\s+[A-Za-z0-9._~+/-]{12,}/i,
  },
  {
    id: "known-secret-env",
    pattern: /\b(?:OPENAI_API_KEY|GEMINI_API_KEY|DEEPSEEK_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|GH_TOKEN|DESENGINE_ALLOWLIST_SALT|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\b\s*[:=]\s*["'`A-Za-z0-9._~+/-]{6,}/,
  },
  {
    id: "generic-secret-assignment",
    pattern: /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\b\s*[:=]\s*['"`][^'"`\n]{8,}['"`]/i,
  },
]

export class SnapshotPublishError extends Error {
  code: "TASK_NOT_STARTED" | "SECRET_DETECTED"
  violations: SnapshotSecretViolation[]

  constructor(
    code: SnapshotPublishError["code"],
    message: string,
    violations: SnapshotSecretViolation[] = [],
  ) {
    super(message)
    this.name = "SnapshotPublishError"
    this.code = code
    this.violations = violations
  }
}

function sanitizePromptHistoryForSnapshot(promptHistory: PromptHistoryEntry[]): SnapshotPromptEntry[] {
  return promptHistory.map((entry) => ({
    text: entry.text,
    createdAt: entry.createdAt,
    displayCreatedAt: entry.displayCreatedAt,
    iterationNumber: entry.iterationNumber,
    levelNumber: entry.levelNumber,
    selectedFileNames: entry.selectedFileNames,
    changedFileNames: entry.changedFileNames,
  }))
}

async function readSnapshotFiles(taskId: string): Promise<SnapshotFileEntry[]> {
  const editableFiles = appConfig.taskWorkbenchFiles.filter((file) => file.edit)

  return Promise.all(
    editableFiles.map(async (file) => ({
      fileId: file.id,
      fileName: file.fileName,
      content: await readFile(getUserTaskFilePath(taskId, file.fileName), "utf-8").catch(() => ""),
    })),
  )
}

function detectSecretViolations(text: string, sourceType: "file" | "prompt", sourceLabel: string) {
  const violations: SnapshotSecretViolation[] = []

  for (const detector of secretDetectors) {
    if (!detector.pattern.test(text)) {
      continue
    }

    violations.push({
      sourceType,
      sourceLabel,
      ruleId: detector.id,
    })
  }

  return violations
}

export function collectSnapshotSecretViolations(
  files: SnapshotFileEntry[],
  promptHistory: SnapshotPromptEntry[],
) {
  const violations: SnapshotSecretViolation[] = []

  for (const file of files) {
    violations.push(...detectSecretViolations(file.content, "file", file.fileName))
  }

  for (const prompt of promptHistory) {
    const promptLabel = `Запрос #${prompt.iterationNumber ?? "?"}`
    violations.push(...detectSecretViolations(prompt.text, "prompt", promptLabel))
  }

  return violations
}

function buildSecretErrorMessage(violations: SnapshotSecretViolation[]) {
  const labels = [...new Set(violations.map((item) => item.sourceLabel))].slice(0, 3)
  const suffix = violations.length > labels.length ? " и ещё в других местах" : ""

  return `Публикация слепка заблокирована: найдены признаки секрета в ${labels.join(", ")}${suffix}. Удалите секреты из файлов или истории промптов и повторите попытку.`
}

export async function publishTaskSnapshot(taskId: string): Promise<{
  snapshot: PublishedSnapshot
  snapshotPath: string
}> {
  const componentFile = appConfig.taskWorkbenchFiles.find((file) => file.id === "component")
  const started = componentFile
    ? await pathExists(getUserTaskFilePath(taskId, componentFile.fileName))
    : false

  if (!started) {
    throw new SnapshotPublishError(
      "TASK_NOT_STARTED",
      "Сначала начните задачу, чтобы опубликовать слепок.",
    )
  }

  const [files, promptHistoryRaw] = await Promise.all([
    readSnapshotFiles(taskId),
    readPromptHistory(taskId),
  ])
  const promptHistory = sanitizePromptHistoryForSnapshot(promptHistoryRaw)
  const violations = collectSnapshotSecretViolations(files, promptHistory)

  if (violations.length > 0) {
    throw new SnapshotPublishError(
      "SECRET_DETECTED",
      buildSecretErrorMessage(violations),
      violations,
    )
  }

  const snapshotId = randomUUID()
  const snapshot: PublishedSnapshot = {
    id: snapshotId,
    version: SNAPSHOT_VERSION,
    taskId,
    publishedAt: new Date().toISOString(),
    files,
    promptHistory,
  }

  await ensureUserSnapshotsDir()
  await writeFile(getSnapshotFilePath(snapshotId), JSON.stringify(snapshot, null, 2), "utf-8")

  return {
    snapshot,
    snapshotPath: createSnapshotPath(snapshotId),
  }
}

export async function readPublishedSnapshot(snapshotId: string): Promise<PublishedSnapshot | null> {
  try {
    const raw = await readFile(getSnapshotFilePath(snapshotId), "utf-8")
    return PublishedSnapshotSchema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}

export { sanitizePromptHistoryForSnapshot }
