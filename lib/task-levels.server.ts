import "server-only"

import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"
import { readLevelCommonExplanation } from "./prompts.server"
import { isTaskStarted, readPromptHistory } from "./repository"
import {
  LevelsCatalogSchema,
  TaskConfigSchema,
  UserProgressStoreSchema,
  type LevelConfig,
  type LevelOverview,
  type LevelOverviewTaskItem,
  type PromptHistoryEntry,
  type TaskLabContext,
  type TaskConfig,
  type TaskListItem,
  type TaskProgress,
  type TaskProgressSummary,
  type TaskTransition,
  type UserProgressStore,
} from "./types"
import {
  cleanupLegacyTaskStateOnReset,
  defaultUserProgressStore,
  ensureUserProgressStorage,
  getTaskCatalogFilePath,
  migrateLegacyUserProgressIfNeeded,
  removeUserTaskDir,
} from "./user-state.server"

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

async function readLevelsCatalogRaw() {
  const levelsRoot = path.join(process.cwd(), "levels")
  const entries = await readdir(levelsRoot, { withFileTypes: true })
  const levelDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  const levels = await Promise.all(
    levelDirs.map(async (levelId) => {
      const [configRaw, overviewRaw] = await Promise.all([
        readFile(path.join(levelsRoot, levelId, "config.json"), "utf-8"),
        readFile(path.join(levelsRoot, levelId, "overview.md"), "utf-8").catch(() => ""),
      ])

      const parsed = JSON.parse(configRaw)
      return {
        ...parsed,
        description: overviewRaw.trim(),
      }
    }),
  )

  return LevelsCatalogSchema.parse({ levels })
}

async function readUserProgressStore() {
  await migrateLegacyUserProgressIfNeeded()

  try {
    const raw = await readFile(appConfig.userProgressFile, "utf-8")
    return UserProgressStoreSchema.parse(JSON.parse(raw))
  } catch {
    return defaultUserProgressStore()
  }
}

async function writeUserProgressStore(store: UserProgressStore) {
  await ensureUserProgressStorage()
  await writeFile(appConfig.userProgressFile, JSON.stringify(store, null, 2), "utf-8")
}

async function readTaskConfig(taskId: string): Promise<TaskConfig> {
  const configPath = getTaskCatalogFilePath(taskId, appConfig.taskConfigFile)
  const rawTaskConfig = await readFile(configPath, "utf-8")
  return TaskConfigSchema.parse(JSON.parse(rawTaskConfig))
}

function buildInitialTaskProgress(maxLevel: number): TaskProgress {
  const levels: TaskProgress["levels"] = Object.fromEntries(
    Array.from({ length: maxLevel }, (_, index) => {
      const levelNumber = index + 1
      return [
        String(levelNumber),
        {
          status: "available" as const,
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
  const firstCreatedAtByLevel = new Map<number, string>()

  for (const entry of promptHistory) {
    const levelNumber = entry.levelNumber ?? 1
    counts.set(levelNumber, (counts.get(levelNumber) ?? 0) + 1)
    if (!firstCreatedAtByLevel.has(levelNumber)) {
      firstCreatedAtByLevel.set(levelNumber, entry.createdAt)
    }
  }

  return {
    counts,
    firstCreatedAtByLevel,
  }
}

function reconcileTaskProgressWithHistory(
  levels: LevelConfig[],
  taskConfig: TaskConfig,
  taskProgress: TaskProgress,
  promptHistory: PromptHistoryEntry[],
) {
  const { counts: countsByLevel, firstCreatedAtByLevel } = countPromptsByLevel(promptHistory)
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

    if (countedPrompts > 0 && !levelProgress.initializedAt) {
      levelProgress.initializedAt = firstCreatedAtByLevel.get(levelNumber) ?? new Date().toISOString()
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

function requireTaskImage(taskConfig: TaskConfig, imageId: string) {
  const images = taskConfig.images as Record<string, { width: number; height: number }>
  const image = images[imageId]
  if (!image) {
    throw new Error(`Для картинки "${imageId}" не заданы размеры в config.json`)
  }

  return image
}

function normalizeEditableFileIds(level: LevelConfig) {
  const knownFileIds = new Set(appConfig.taskWorkbenchFiles.map((file) => file.id))
  return level.editableFileIds.filter((fileId) => knownFileIds.has(fileId))
}

function resolveTaskExplanation(
  levelNumber: number,
  levelTaskNotes: Record<string, string>,
) {
  const directNote = levelTaskNotes[String(levelNumber)]

  if (directNote) {
    return directNote
  }
  return ""
}

async function buildTaskLabContext(
  taskId: string,
  level: LevelConfig,
  taskConfig: TaskConfig,
): Promise<TaskLabContext> {
  const levelTaskNotes = taskConfig.levelTaskNotes as Record<string, string>
  const taskExplanation = resolveTaskExplanation(level.number, levelTaskNotes)

  const commonExplanation = await readLevelCommonExplanation(
    level.id,
    level.description,
  )

  return {
    levelId: level.id,
    levelNumber: level.number,
    labId: level.labId,
    commonExplanation,
    taskExplanation,
    editableFileIds: normalizeEditableFileIds(level),
    images: level.images.map((imageConfig) => {
      const size = requireTaskImage(taskConfig, imageConfig.id)

      return {
        id: imageConfig.id,
        src: `/api/tasks/${taskId}/image?imageId=${encodeURIComponent(imageConfig.id)}`,
        width: size.width,
        height: size.height,
        show: imageConfig.show,
      }
    }),
  }
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
    currentLevelInitialized: Boolean(levelProgress.initializedAt),
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
  const entries = await readdir(appConfig.taskCatalogRoot, { withFileTypes: true })
  const taskDirs = entries.filter((entry) => entry.isDirectory())

  const tasks = await Promise.all(
    taskDirs.map(async (entry) => {
      const config = await readTaskConfig(entry.name)
      const started = await isTaskStarted(entry.name)

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

  const result = tasks.map((task) => {
    const taskProgress = ensureTaskProgress(store, task.id, task.config.maxLevel)
    return buildTaskListItem(task, levels, taskProgress)
  })

  return result
}

export async function getLevelOverview(levelId?: string | null): Promise<LevelOverview> {
  const [levels, store, tasks] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskCatalog(),
  ])

  const taskSnapshots = tasks.map((task) => {
    const taskProgress = ensureTaskProgress(store, task.id, task.config.maxLevel)
    return { task, taskProgress }
  })

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

export async function getTaskPendingTransition(taskId: string): Promise<TaskTransition | null> {
  const [levels, store, taskConfig, promptHistory] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskConfig(taskId),
    readPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)

  const currentLevelNumber = taskProgress.currentLevel
  const currentLevelProgress = taskProgress.levels[String(currentLevelNumber)]

  if (currentLevelProgress?.status === "completed" && currentLevelNumber === taskConfig.maxLevel) {
    return buildTransition(
      levels,
      taskId,
      currentLevelNumber,
      null,
      currentLevelProgress.completionReason ?? "prompt_limit",
    )
  }

  if (currentLevelNumber <= 1) {
    return null
  }

  if (
    currentLevelProgress?.promptsUsed > 0
    || Boolean(currentLevelProgress?.initializedAt)
    || currentLevelProgress?.status === "in_progress"
    || currentLevelProgress?.status === "completed"
  ) {
    return null
  }

  const previousLevelNumber = currentLevelNumber - 1
  const previousLevelProgress = taskProgress.levels[String(previousLevelNumber)]

  if (!previousLevelProgress || previousLevelProgress.status !== "completed") {
    return null
  }

  return buildTransition(
    levels,
    taskId,
    previousLevelNumber,
    currentLevelNumber,
    previousLevelProgress.completionReason ?? "prompt_limit",
  )
}

export async function getTaskLabContext(taskItem: TaskListItem) {
  const [levels, taskConfig] = await Promise.all([
    getLevelsCatalog(),
    readTaskConfig(taskItem.id),
  ])

  const level = requireLevel(levels, taskItem.progress.currentLevel)
  return buildTaskLabContext(taskItem.id, level, taskConfig)
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
    readPromptHistory(taskId),
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

export async function markCurrentTaskLevelInitialized(taskId: string) {
  const [levels, store, taskConfig, promptHistory] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskConfig(taskId),
    readPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)

  const currentLevelNumber = taskProgress.currentLevel
  const levelProgress = taskProgress.levels[String(currentLevelNumber)]
  let changed = false

  if (!levelProgress.initializedAt) {
    levelProgress.initializedAt = new Date().toISOString()
    changed = true
  }

  if (levelProgress.status === "available") {
    levelProgress.status = "in_progress"
    changed = true
  }

  if (changed) {
    taskProgress.updatedAt = new Date().toISOString()
    await writeUserProgressStore(store)
  }

  return summarizeTaskProgress(levels, taskConfig, taskProgress)
}

export async function registerPromptForCurrentLevel(taskId: string): Promise<TaskProgressMutationResult> {
  const [levels, store, taskConfig, promptHistory] = await Promise.all([
    getLevelsCatalog(),
    readUserProgressStore(),
    readTaskConfig(taskId),
    readPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)
  const currentLevelNumber = taskProgress.currentLevel
  const currentLevel = requireLevel(levels, currentLevelNumber)
  const levelProgress = taskProgress.levels[String(currentLevelNumber)]

  if (!levelProgress.initializedAt) {
    return {
      summary: summarizeTaskProgress(levels, taskConfig, taskProgress),
      transition: null,
    }
  }

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
    readPromptHistory(taskId),
  ])

  const taskProgress = ensureTaskProgress(store, taskId, taskConfig.maxLevel)
  reconcileTaskProgressWithHistory(levels, taskConfig, taskProgress, promptHistory)
  const currentLevelNumber = taskProgress.currentLevel
  const currentLevel = requireLevel(levels, currentLevelNumber)
  const levelProgress = taskProgress.levels[String(currentLevelNumber)]

  if (levelProgress.status === "completed" && currentLevelNumber === taskConfig.maxLevel) {
    return {
      summary: summarizeTaskProgress(levels, taskConfig, taskProgress),
      transition: buildTransition(levels, taskId, currentLevelNumber, null, reason),
    }
  }

  levelProgress.status = "completed"
  if (reason === "manual") {
    levelProgress.promptsUsed = currentLevel.maxPromptsPerTask
  }
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

export async function resetTask(taskId: string) {
  const store = await readUserProgressStore()

  await removeUserTaskDir(taskId)
  await cleanupLegacyTaskStateOnReset(taskId)

  if (store.tasks[taskId]) {
    delete store.tasks[taskId]
    await writeUserProgressStore(store)
  }
}
