/**
 * Типы и схемы доменной сущности «Задача»
 */


import { z } from "zod"

import type { PromptHistoryEntry } from "../prompt/types"
import type { LevelConfig } from "../level/types"

import {
    TaskConfigSchema,
    TaskLevelProgressSchema,
    TaskProgressSchema,
    CheckingStateSchema
} from "./schema"

type TaskConfig = z.infer<typeof TaskConfigSchema>


type TaskLevelProgress = z.infer<typeof TaskLevelProgressSchema>

type TaskProgress = z.infer<typeof TaskProgressSchema>

type TaskProgressSummary = {
  currentLevel: number
  currentLevelId: string
  currentLevelStatus: TaskLevelProgress["status"]
  currentLevelDisplayStatus: "available" | "in_progress" | "awaiting_check_retry" | "completed"
  currentLevelStarted: boolean
  currentLevelNotStarted: boolean
  promptsUsed: number
  promptsLimit: number
  promptsRemaining: number
  checkAttemptsUsed: number
  checkAttemptsLimit: number
  checkingState: z.infer<typeof CheckingStateSchema>
  maxLevel: number
  isCompleted: boolean
  hasNextLevel: boolean
}

type TaskListItem = {
  id: string
  image: TaskConfig["image"]
  started: boolean
  maxLevel: number
  progress: TaskProgressSummary
}

export type TaskLlmUsageSummary = {
  totalCalls: number
  teachingCostCents: number
  providersUsed: string[]
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  callsWithoutProviderMetrics: number
}

export type TaskLabImage = {
  id: string
  src: string
  width: number
  height: number
  show: boolean
}

export type TaskLabContext = {
  levelId: string
  levelNumber: number
  labId: string
  commonExplanation: string
  taskTip: string
  editableFileIds: string[]
  images: TaskLabImage[]
}

// все файлы
// ? Тут точно нужен taskId?
export type TaskData = {
  taskId: string
  contentByFileId: Record<string, string>
  promptHistory: PromptHistoryEntry[]
  llmUsageSummary: TaskLlmUsageSummary
  labContext: TaskLabContext | null
}


export type TaskCheckResultKind = "passed" | "failed" | "technical_error" | "failed_and_reset"

export type TaskCheckResult = {
  taskId: string
  levelId: string
  levelNumber: number
  levelTitle: string
  attemptNumber: number
  maxCheckAttempts: number
  passed: boolean
  message: string
  kind: TaskCheckResultKind
  createdAt: string
}

export type TaskTransition = {
  taskId: string
  fromLevel: LevelConfig
  toLevel: LevelConfig | null
  fromTaskTip: string
  toTaskTip: string | null
}


export {
    type TaskListItem,
    type TaskConfig,
    type TaskLevelProgress,
    type TaskProgress,
    type TaskProgressSummary,
    TaskConfigSchema,
    TaskLevelProgressSchema,
    TaskProgressSchema,
}
