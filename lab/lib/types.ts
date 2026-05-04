import { z } from "zod"
import type { LlmCallRecord } from "./llm.types"

const TaskConfigSchema = z.object({
  image: z.object({
    width: z.number(),
    height: z.number(),
  }),
  maxLevel: z.number().int().min(1),
})

type TaskConfig = z.infer<typeof TaskConfigSchema>

const LevelConfigSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  promptKey: z.string().min(1),
  layoutKey: z.string().min(1),
  contentKey: z.string().min(1),
  maxPromptsPerTask: z.number().int().min(1),
})

const LevelsCatalogSchema = z.object({
  levels: z.array(LevelConfigSchema).min(1),
})

const TaskLevelProgressSchema = z.object({
  status: z.enum(["available", "in_progress", "completed"]),
  promptsUsed: z.number().int().min(0),
  initializedAt: z.string().optional(),
  completedAt: z.string().optional(),
  completionReason: z.enum(["manual", "prompt_limit"]).optional(),
})

const TaskProgressSchema = z.object({
  currentLevel: z.number().int().min(1),
  levels: z.record(z.string(), TaskLevelProgressSchema),
  updatedAt: z.string().optional(),
})

const UserProgressStoreSchema = z.object({
  tasks: z.record(z.string(), TaskProgressSchema),
})

type LevelConfig = z.infer<typeof LevelConfigSchema>
type LevelsCatalog = z.infer<typeof LevelsCatalogSchema>
type TaskLevelProgress = z.infer<typeof TaskLevelProgressSchema>
type TaskProgress = z.infer<typeof TaskProgressSchema>
type UserProgressStore = z.infer<typeof UserProgressStoreSchema>

type TaskProgressSummary = {
  currentLevel: number
  currentLevelId: string
  currentLevelStatus: TaskLevelProgress["status"]
  currentLevelInitialized: boolean
  promptsUsed: number
  promptsLimit: number
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

export type PromptHistoryEntry = {
  text: string
  createdAt: string
  selectedFileIds: string[]
  levelNumber?: number
  changedFileIds?: string[]
  llmCall?: LlmCallRecord
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

// все файлы
// ? Тут точно нужен taskId?
export type TaskData = {
  taskId: string
  contentByFileId: Record<string, string>
  promptHistory: PromptHistoryEntry[]
  llmUsageSummary: TaskLlmUsageSummary
}

export type LevelOverviewTaskItem = TaskListItem & {
  nextUnlockedLevel: number | null
}

export type LevelOverview = {
  level: LevelConfig
  availableTasks: LevelOverviewTaskItem[]
  passedTasks: LevelOverviewTaskItem[]
  prevLevelId: string | null
  nextLevelId: string | null
}

export type LabScreenState =
  | { type: "level" }
  | { type: "task" }
  | { type: "transition"; transition: TaskTransition }

export type TaskTransition = {
  taskId: string
  fromLevel: LevelConfig
  toLevel: LevelConfig | null
  reason: "manual" | "prompt_limit"
}

export {
    type TaskListItem,
    type TaskConfig,
    type LevelConfig,
    type LevelsCatalog,
    type TaskLevelProgress,
    type TaskProgress,
    type UserProgressStore,
    type TaskProgressSummary,
    TaskConfigSchema,
    LevelConfigSchema,
    LevelsCatalogSchema,
    TaskLevelProgressSchema,
    TaskProgressSchema,
    UserProgressStoreSchema,
}
