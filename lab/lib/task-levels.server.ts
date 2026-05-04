import "server-only"

import { access, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"
import {
  LevelsCatalogSchema,
  TaskConfigSchema,
  UserProgressStoreSchema,
  type PromptHistoryEntry,
  type LevelConfig,
  type LevelOverview,
  type LevelOverviewTaskItem,
  type TaskConfig,
  type TaskListItem,
  type TaskProgress,
  type TaskProgressSummary,
  type TaskTransition,
  type UserProgressStore,
} from "./types"

type CompletionReason = "manual" | "prompt_limit"

type TaskCatalogItem = {
  id: string
  config: TaskConfig
  started: boolean
}

type TaskProgressMutationResult = {
  summary: TaskProgressSummary
  transition: TaskTransition | null
}

const levelsConfigPath = path.join(process.cwd(), "levels", "config.json")

function defaultUserProgressStore(): UserProgressStore {
  return { tasks: {} }
}

async function readLevelsCatalogRaw() {
  const raw = await readFile(levelsConfigPath, "utf-8")
  return LevelsCatalogSchema.parse(JSON.parse(raw))
}

async function readUserProgressStore() {
  try {
    const raw = await readFile(appConfig.userProgressFile, "utf-8")
    return UserProgressStoreSchema.parse(JSON.parse(raw))
  } catch {
    return defaultUserProgressStore()
  }
}

async function writeUserProgressStore(store: UserProgressStore) {
  await writeFile(appConfig.userProgressFile, JSON.stringify(store, null, 2), "utf-8")
}

async function readTaskConfig(taskId: string): Promise<TaskConfig> {
  const configPath = path.join(appConfig.tasksRoot, taskId, appConfig.taskConfigFile)
  const rawTaskConfig = await readFile(configPath, "utf-8")
  return TaskConfigSchema.parse(JSON.parse(rawTaskConfig))
}

async function readTaskPromptHistory(taskId: string): Promise<PromptHistoryEntry[]> {
  const filePath = path.join(appConfig.tasksRoot, taskId, "prompt-history.json")

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is PromptHistoryEntry => {
      return (
        entry &&
        typeof entry.text === "string" &&
        typeof entry.createdAt === "string" &&
        Array.isArray(entry.selectedFileIds) &&
        (typeof entry.levelNumber === "number" || typeof entry.levelNumber === "undefined") &&
        entry.selectedFileIds.every((item: unknown) => typeof item === "string")
      )
    })
  } catch {
    return []
  }
}

function buildInitialTaskProgress(maxLevel: number): TaskProgress {
  const levels = Object.fromEntries(
    Array.from({ length: maxLevel }, (_, index) => {
      const levelNumber = index + 1
      return [
        String(levelNumber),
        {
          status: "available",
          promptsUsed: 0,
        },
      ]
    }),
  )

  return {
    currentLevel: 1,
    levels,
  }
}

function normalizeTaskProgress(taskProgress: TaskProgress, maxLevel: number): TaskProgress {
  const nextLevels = { ...taskProgress.levels }

  for (let levelNumber = 1; levelNumber <= maxLevel; levelNumber += 1) {
    const key = String(levelNumber)
    if (!nextLevels[key]) {
      nextLevels[key] = {
        status: "available",
        promptsUsed: 0,
      }
    }
  }

  for (const key of Object.keys(nextLevels)) {
    const levelNumber = Number(key)
    if (!Number.isFinite(levelNumber) || levelNumber > maxLevel) {
      delete nextLevels[key]
    }
  }

  return {
    currentLevel: Math.min(Math.max(taskProgress.currentLevel, 1), maxLevel),
    levels: nextLevels,
    updatedAt: taskProgress.updatedAt,
  }
}

function ensureTaskProgress(
  store: UserProgressStore,
  taskId: string,
  maxLevel: number,
) {
  const existing = store.tasks[taskId]
  const normalized = existing
    ? normalizeTaskProgress(existing, maxLevel)
    : buildInitialTaskProgress(maxLevel)

  store.tasks[taskId] = normalized
  return normalized
}

function countPromptsByLevel(promptHistory: PromptHistoryEntry[]) {
  const counts = new Map<number, number>()

  for (const entry of promptHistory) {
    const levelNumber = entry.levelNumber ?? 1
    counts.set(levelNumber, (counts.get(levelNumber) ?? 0) + 1)
  }

  return counts
}

function reconcileTaskProgressWithHistory(
  levels: LevelConfig[],
  taskConfig: TaskConfig,
  taskProgress: TaskProgress,
  promptHistory: PromptHistoryEntry[],
) {
  const countsByLevel = countPromptsByLevel(promptHistory)
  let changed = false

  for (let levelNumber = 1; levelNumber <= taskConfig.maxLevel; levelNumber += 1) {
    const key = String(levelNumber)
    const countedPrompts = countsByLevel.get(levelNumber) ?? 0
    const levelProgress = taskProgress.levels[key]
    const levelConfig = requireLevel(levels, levelNumber)

    if (countedPrompts > levelProgress.promptsUsed) {
      levelProgress.promptsUsed = countedPrompts
      changed = true
    }

    if (countedPrompts > 0 && levelProgress.status === "available") {
      levelProgress.status = "in_progress"
      changed = true
    }

    if (levelProgress.promptsUsed >= levelConfig.maxPromptsPerTask && levelProgress.status !== "completed") {
      levelProgress.status = "completed"
      levelProgress.completionReason ??= "prompt_limit"
      changed = true
    }
  }

  const currentLevelProgress = taskProgress.levels[String(taskProgress.currentLevel)]
  if (currentLevelProgress?.status === "completed" && taskProgress.currentLevel < taskConfig.maxLevel) {
    const nextLevel = taskProgress.currentLevel + 1
    const nextLevelProgress = taskProgress.levels[String(nextLevel)]

    if (nextLevelProgress && nextLevelProgress.promptsUsed > 0) {
      taskProgress.currentLevel = nextLevel
      changed = true
    }
  }

  if (changed) {
    taskProgress.updatedAt = new Date().toISOString()
  }

  return changed
}

function requireLevel(levels: LevelConfig[], levelNumber: number) {
  const level = levels.find((item) => item.number === levelNumber)
  if (!level) {
    throw new Error(`Уровень ${levelNumber} не найден в каталоге`)
  }
  return level
}

function summarizeTaskProgress(
  levels: LevelConfig[],
  taskConfig: TaskConfig,
  taskProgress: TaskProgress,
): TaskProgressSummary {
  const currentLevelNumber = Math.min(taskProgress.currentLevel, taskConfig.maxLevel)
  const currentLevel = requireLevel(levels, currentLevelNumber)
  const levelProgress = taskProgress.levels[String(currentLevelNumber)] ?? {
    status: "available" as const,
    promptsUsed: 0,
  }

  return {
    currentLevel: currentLevelNumber,
    currentLevelId: currentLevel.id,
    currentLevelStatus: levelProgress.status,
    promptsUsed: levelProgress.promptsUsed,
    promptsLimit: currentLevel.maxPromptsPerTask,
    maxLevel: taskConfig.maxLevel,
    isCompleted:
      levelProgress.status === "completed" && currentLevelNumber === taskConfig.maxLevel,
    hasNextLevel: currentLevelNumber < taskConfig.maxLevel,
  }
}

function buildTaskListItem(
  task: TaskCatalogItem,
  levels: LevelConfig[],
  taskProgress: TaskProgress,
): TaskListItem {
  return {
    id: task.id,
    image: task.config.image,
    started: task.started,
    maxLevel: task.config.maxLevel,
    progress: summarizeTaskProgress(levels, task.config, taskProgress),
  }
}

function buildPassedTaskItem(taskItem: TaskListItem, nextUnlockedLevel: number | null): LevelOverviewTaskItem {
  return {
    ...taskItem,
    nextUnlockedLevel,
  }
}

async function readTaskCatalog(): Promise<TaskCatalogItem[]> {
  const entries = await readdir(appConfig.tasksRoot, { withFileTypes: true })
  const taskDirs = entries.filter((entry) => entry.isDirectory())
  const componentFile = appConfig.taskWorkbenchFiles.find((file) => file.id === "component")

  const tasks = await Promise.all(
    taskDirs.map(async (entry) => {
      const config = await readTaskConfig(entry.name)
      const started = componentFile
        ? await access(path.join(appConfig.tasksRoot, entry.name, componentFile.fileName))
            .then(() => true)
            .catch(() => false)
        : false

      return {
        id: entry.name,
        config,
        started,
      }
    }),
  )

  return tasks.sort((a, b) => a.id.localeCompare(b.id))
}

export async function getLevelsCatalog() {
  const catalog = await readLevelsCatalogRaw()
  return catalog.levels.slice().sort((a, b) => a.number - b.number)
}

export async function getLevelById(levelId: string) {
  const levels = await getLevelsCatalog()
  return levels.find((level) => level.id === levelId) ?? null
}

export async function getTaskListItemsWithProgress(): Promise<TaskListItem[]> {
  const [levels, store, tasks] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskCatalog(),
  ])

  let changed = false

  const result = await Promise.all(tasks.map(async (task) => {
    const taskProgress = ensureTaskProgress(store, task.id, task.config.maxLevel)
    const promptHistory = await readTaskPromptHistory(task.id)
    if (reconcileTaskProgressWithHistory(levels, task.config, taskProgress, promptHistory)) {
      changed = true
    }
    return buildTaskListItem(task, levels, taskProgress)
  }))

  if (changed) {
    await writeUserProgressStore(store)
  }

  return result
}

export async function getLevelOverview(levelId?: string | null): Promise<LevelOverview> {
  const [levels, store, tasks] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskCatalog(),
  ])

  let changed = false

  const taskSnapshots = await Promise.all(tasks.map(async (task) => {
    const taskProgress = ensureTaskProgress(store, task.id, task.config.maxLevel)
    const promptHistory = await readTaskPromptHistory(task.id)
    if (reconcileTaskProgressWithHistory(levels, task.config, taskProgress, promptHistory)) {
      changed = true
    }

    return { task, taskProgress }
  }))

  const fallbackLevel =
    levels.find((level) =>
      taskSnapshots.some(({ task, taskProgress }) => {
        const summary = summarizeTaskProgress(levels, task.config, taskProgress)
        return summary.currentLevel === level.number && summary.currentLevelStatus !== "completed"
      }),
    ) ?? levels[0]

  const level = levels.find((item) => item.id === levelId) ?? fallbackLevel

  const availableTasks: LevelOverviewTaskItem[] = []
  const passedTasks: LevelOverviewTaskItem[] = []

  for (const { task, taskProgress } of taskSnapshots) {
    if (task.config.maxLevel < level.number) continue

    const taskItem = buildTaskListItem(task, levels, taskProgress)
    const isCurrentLevel = taskItem.progress.currentLevel === level.number

    if (isCurrentLevel && taskItem.progress.currentLevelStatus !== "completed") {
      availableTasks.push(buildPassedTaskItem(taskItem, null))
      continue
    }

    if (taskItem.progress.currentLevel > level.number) {
      passedTasks.push(buildPassedTaskItem(taskItem, taskItem.progress.currentLevel))
      continue
    }

    if (isCurrentLevel && taskItem.progress.currentLevelStatus === "completed") {
      passedTasks.push(buildPassedTaskItem(taskItem, null))
    }
  }

  const levelIndex = levels.findIndex((item) => item.id === level.id)

  if (changed) {
    await writeUserProgressStore(store)
  }

  return {
    level,
    availableTasks: availableTasks.sort((a, b) => a.id.localeCompare(b.id)),
    passedTasks: passedTasks.sort((a, b) => a.id.localeCompare(b.id)),
    prevLevelId: levelIndex > 0 ? levels[levelIndex - 1]?.id ?? null : null,
    nextLevelId: levelIndex < levels.length - 1 ? levels[levelIndex + 1]?.id ?? null : null,
  }
}

export async function getAllLevelOverviews(): Promise<LevelOverview[]> {
  const levels = await getLevelsCatalog()
  return Promise.all(levels.map((level) => getLevelOverview(level.id)))
}

export async function getTaskListItemById(taskId: string) {
  const taskListItems = await getTaskListItemsWithProgress()
  return taskListItems.find((task) => task.id === taskId) ?? null
}

export async function getLevelForTaskItem(taskItem: TaskListItem) {
  const levels = await getLevelsCatalog()
  return requireLevel(levels, taskItem.progress.currentLevel)
}

function buildTransition(
  levels: LevelConfig[],
  taskId: string,
  fromLevelNumber: number,
  toLevelNumber: number | null,
  reason: CompletionReason,
): TaskTransition {
  return {
    taskId,
    fromLevel: requireLevel(levels, fromLevelNumber),
    toLevel: toLevelNumber === null ? null : requireLevel(levels, toLevelNumber),
    reason,
  }
}

export async function markTaskLevelInProgress(taskId: string) {
  const [levels, store, taskConfig, promptHistory] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskConfig(taskId),
    readTaskPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  let changed = reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)
  const currentLevelKey = String(taskProgress.currentLevel)
  const currentLevel = taskProgress.levels[currentLevelKey]

  if (currentLevel.status === "available") {
    currentLevel.status = "in_progress"
    taskProgress.updatedAt = new Date().toISOString()
    changed = true
  }

  if (changed) {
    await writeUserProgressStore(store)
  }

  return summarizeTaskProgress(levels, taskConfig, taskProgress)
}

export async function registerPromptForCurrentLevel(taskId: string): Promise<TaskProgressMutationResult> {
  const [levels, store, taskConfig, promptHistory] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskConfig(taskId),
    readTaskPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)
  const currentLevelNumber = taskProgress.currentLevel
  const currentLevel = requireLevel(levels, currentLevelNumber)
  const levelProgress = taskProgress.levels[String(currentLevelNumber)]

  if (levelProgress.status === "completed") {
    return {
      summary: summarizeTaskProgress(levels, taskConfig, taskProgress),
      transition: null,
    }
  }

  levelProgress.status = "in_progress"
  levelProgress.promptsUsed += 1
  taskProgress.updatedAt = new Date().toISOString()

  let transition: TaskTransition | null = null

  if (levelProgress.promptsUsed >= currentLevel.maxPromptsPerTask) {
    levelProgress.status = "completed"
    levelProgress.completedAt = new Date().toISOString()
    levelProgress.completionReason = "prompt_limit"

    if (currentLevelNumber < taskConfig.maxLevel) {
      taskProgress.currentLevel = currentLevelNumber + 1
      transition = buildTransition(levels, taskId, currentLevelNumber, currentLevelNumber + 1, "prompt_limit")
    } else {
      transition = buildTransition(levels, taskId, currentLevelNumber, null, "prompt_limit")
    }
  }

  await writeUserProgressStore(store)

  return {
    summary: summarizeTaskProgress(levels, taskConfig, taskProgress),
    transition,
  }
}

export async function completeCurrentTaskLevel(
  taskId: string,
  reason: CompletionReason,
): Promise<TaskProgressMutationResult> {
  const [levels, store, taskConfig, promptHistory] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskConfig(taskId),
    readTaskPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)
  const currentLevelNumber = taskProgress.currentLevel
  const levelProgress = taskProgress.levels[String(currentLevelNumber)]

  if (levelProgress.status === "completed" && currentLevelNumber === taskConfig.maxLevel) {
    return {
      summary: summarizeTaskProgress(levels, taskConfig, taskProgress),
      transition: buildTransition(levels, taskId, currentLevelNumber, null, reason),
    }
  }

  levelProgress.status = "completed"
  levelProgress.completedAt = new Date().toISOString()
  levelProgress.completionReason = reason
  taskProgress.updatedAt = new Date().toISOString()

  let transition: TaskTransition | null

  if (currentLevelNumber < taskConfig.maxLevel) {
    taskProgress.currentLevel = currentLevelNumber + 1
    transition = buildTransition(levels, taskId, currentLevelNumber, currentLevelNumber + 1, reason)
  } else {
    transition = buildTransition(levels, taskId, currentLevelNumber, null, reason)
  }

  await writeUserProgressStore(store)

  return {
    summary: summarizeTaskProgress(levels, taskConfig, taskProgress),
    transition,
  }
}
