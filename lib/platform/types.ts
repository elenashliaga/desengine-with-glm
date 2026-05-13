import { z } from "zod"
import type { LlmCallRecord } from "@/lib/llm/llm.types"

const TaskImageSchema = z.object({
  width: z.number(),
  height: z.number(),
})

const TaskConfigRawSchema = z.object({
  images: z
    .object({
      base: TaskImageSchema,
      variants: TaskImageSchema.optional(),
    })
    .catchall(TaskImageSchema),

  maxLevel: z.number().int().min(1),
})

const TaskConfigSchema = TaskConfigRawSchema.transform((value) => {
  const base = value.images.base
  const variants = value.images.variants ?? null

  return {
    image: base,
    base,
    variants,
    images: value.images,
    maxLevel: value.maxLevel,
  }
})

type TaskConfig = z.infer<typeof TaskConfigSchema>

const LevelImageConfigSchema = z.object({
  id: z.string().min(1),
  show: z.boolean(),
})

const LevelConfigSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().optional(),
  layoutKey: z.string().min(1),
  maxPromptsPerTask: z.number().int().min(1),
  maxCheckAttempts: z.number().int().min(1).optional(),
  labId: z.string().min(1).optional(),
  images: z.array(LevelImageConfigSchema).optional(),
  editableFileIds: z.array(z.string().min(1)).optional(),
}).transform((value) => {
  const defaultImages =
    value.number === 1
      ? [{ id: "base", show: true }]
      : [
          { id: "base", show: true },
          { id: "variants", show: true },
        ]

  const defaultEditableFileIds =
    value.number === 1
      ? ["component", "stories"]
      : value.number === 2
        ? ["component", "stories", "styles"]
        : ["component", "stories", "styles", "mock", "props"]

  return {
    ...value,
    url: value.url?.trim() ? value.url.trim() : undefined,
    labId: value.labId ?? (value.number === 1 ? "level-1" : value.number === 2 ? "level-2" : "shared-lab"),
    maxCheckAttempts: value.maxCheckAttempts ?? 3,
    images: value.images ?? defaultImages,
    editableFileIds: value.editableFileIds ?? defaultEditableFileIds,
  }
})

const CompletionReasonSchema = z.enum(["check_passed"])
const CheckingStateSchema = z.enum(["idle", "awaiting_retry"])

const LevelsCatalogSchema = z.object({
  levels: z.array(LevelConfigSchema).min(1),
})

const TaskLevelProgressSchema = z.object({
  status: z.enum(["available", "in_progress", "completed"]),
  promptsUsed: z.number().int().min(0),
  initializedAt: z.string().optional(),
  completedAt: z.string().optional(),
  completionReason: CompletionReasonSchema.optional(),
  checkAttemptsUsed: z.number().int().min(0).optional(),
  checkingState: CheckingStateSchema.optional(),
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
  completionReason: TaskLevelProgress["completionReason"] | null
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
  displayCreatedAt?: string
  iterationNumber?: number
  levelNumber?: number
  selectedFileNames?: string[]
  changedFileIds?: string[]
  changedFileNames?: string[]
  teachingCostCents?: number
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

export type LevelOverviewTaskItem = TaskListItem & {
  nextUnlockedLevel: number | null
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

export type LevelOverview = {
  level: LevelConfig
  availableTasks: LevelOverviewTaskItem[]
  passedTasks: LevelOverviewTaskItem[]
  prevLevelId: string | null
  nextLevelId: string | null
}

export type LabScreenState =
  | { type: "level" }
  | { type: "task"; screen: string }
  | { type: "transition"; transition: TaskTransition }
  | { type: "done"; transition: TaskTransition }
  | { type: "check"; result: TaskCheckResult; transition: TaskTransition | null }

export type TaskTransition = {
  taskId: string
  fromLevel: LevelConfig
  toLevel: LevelConfig | null
  fromTaskTip: string
  toTaskTip: string | null
  reason: z.infer<typeof CompletionReasonSchema>
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
