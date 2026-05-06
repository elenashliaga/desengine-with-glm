import { z } from "zod"
import type { LlmCallRecord } from "./llm.types"

const TaskImageSchema = z.object({
  width: z.number(),
  height: z.number(),
})

const LegacyTaskConfigSchema = z.union([
  z.object({
    image: TaskImageSchema,
    maxLevel: z.number().int().min(1),
  }),
  z.object({
    base: TaskImageSchema,
    variants: TaskImageSchema.optional(),
    maxLevel: z.number().int().min(1),
  }),
])

const ModernTaskConfigSchema = z.object({
  images: z.record(z.string().min(1), TaskImageSchema),
  levelTaskNotes: z.record(z.string().min(1), z.string().min(1)),
  maxLevel: z.number().int().min(1),
})

const TaskConfigSchema = z
  .union([ModernTaskConfigSchema, LegacyTaskConfigSchema])
  .transform((value) => {
    if ("images" in value) {
      const base = value.images.base
      const variants = value.images.variants ?? null

      return {
        image: base,
        base,
        variants,
        images: {
          ...value.images,
          ...(variants ? { variants } : {}),
        },
        levelTaskNotes: value.levelTaskNotes,
        maxLevel: value.maxLevel,
      }
    }

    if ("image" in value) {
      return {
        image: value.image,
        base: value.image,
        variants: null,
        images: {
          base: value.image,
        },
        levelTaskNotes: {},
        maxLevel: value.maxLevel,
      }
    }

    return {
      image: value.base,
      base: value.base,
      variants: value.variants ?? null,
      images: {
        base: value.base,
        ...(value.variants ? { variants: value.variants } : {}),
      },
      levelTaskNotes: {},
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
  promptKey: z.string().min(1),
  layoutKey: z.string().min(1),
  maxPromptsPerTask: z.number().int().min(1),
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
    labId: value.labId ?? (value.number === 1 ? "level-1" : value.number === 2 ? "level-2" : "shared-lab"),
    images: value.images ?? defaultImages,
    editableFileIds: value.editableFileIds ?? defaultEditableFileIds,
  }
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
  taskExplanation: string
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
