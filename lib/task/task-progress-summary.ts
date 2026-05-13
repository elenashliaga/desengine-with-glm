import type {
  TaskConfig,
  TaskLevelProgress,
  TaskProgress,
  TaskProgressSummary,
} from "./types"

import type {
    LevelConfig,
} from "../level/types"

function requireLevel(levels: LevelConfig[], levelNumber: number) {
  const level = levels.find((item) => item.number === levelNumber)
  if (!level) {
    throw new Error(`Уровень ${levelNumber} не найден в каталоге`)
  }

  return level
}

export function isLevelStarted(levelProgress: TaskLevelProgress | undefined) {
  if (!levelProgress) {
    return false
  }

  return Boolean(
    levelProgress.initializedAt
      || levelProgress.completedAt
      || levelProgress.promptsUsed > 0
      || levelProgress.status !== "available",
  )
}

export function getCurrentLevelDisplayStatus(
  levelProgress: TaskLevelProgress,
): TaskProgressSummary["currentLevelDisplayStatus"] {
  if (levelProgress.status === "completed") {
    return "completed"
  }

  if (levelProgress.checkingState === "awaiting_retry") {
    return "awaiting_check_retry"
  }

  if (levelProgress.status === "in_progress") {
    return "in_progress"
  }

  return "available"
}

export function summarizeTaskProgress(
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
  const currentLevelStarted = isLevelStarted(levelProgress)

  return {
    currentLevel: currentLevelNumber,
    currentLevelId: currentLevel.id,
    currentLevelStatus: levelProgress.status,
    currentLevelDisplayStatus: getCurrentLevelDisplayStatus(levelProgress),
    currentLevelStarted,
    currentLevelNotStarted: !currentLevelStarted,
    promptsUsed: levelProgress.promptsUsed,
    promptsLimit: currentLevel.maxPromptsPerTask,
    promptsRemaining: Math.max(currentLevel.maxPromptsPerTask - levelProgress.promptsUsed, 0),
    checkAttemptsUsed: levelProgress.checkAttemptsUsed ?? 0,
    checkAttemptsLimit: currentLevel.maxCheckAttempts,
    checkingState: levelProgress.checkingState ?? "idle",
    maxLevel: taskConfig.maxLevel,
    isCompleted:
      levelProgress.status === "completed" && currentLevelNumber === taskConfig.maxLevel,
    hasNextLevel: currentLevelNumber < taskConfig.maxLevel,
  }
}
