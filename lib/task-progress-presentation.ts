import type { TaskListItem } from "./types"

export function getIndicatorWidth(task: TaskListItem) {
  if (!task.started) return "0%"
  if (task.progress.isCompleted) return "100%"

  const ratio = task.progress.currentLevel / task.progress.maxLevel
  return `${Math.max(ratio * 100, 8)}%`
}

export function getLevelBadgeText(task: TaskListItem) {
  if (!task.started) return "lvl 0"
  if (task.progress.isCompleted) return "done"
  return `lvl ${task.progress.currentLevel}`
}

export function getStatusText(task: TaskListItem) {
  if (!task.started) return "Не начиналась"
  if (task.progress.currentLevelDisplayStatus === "awaiting_check_retry") {
    return "Ждёт проверки"
  }
  if (task.progress.isCompleted) {
    if (task.progress.completionReason === "check_passed") {
      return "Проверка пройдена, задача завершена"
    }

    return "Задача завершена"
  }
  if (task.progress.currentLevelNotStarted) {
    return `Уровень ${task.progress.currentLevel} из ${task.progress.maxLevel} ещё не начат`
  }

  return `Уровень ${task.progress.currentLevel} из ${task.progress.maxLevel}`
}

export function getPromptRemainderText(task: TaskListItem) {
  if (!task.started) {
    return `Уточнений на уровне: ${task.progress.promptsLimit}`
  }

  if (task.progress.currentLevelNotStarted) {
    return `Новый текущий уровень ещё не начат. После старта будет доступно ${task.progress.promptsLimit} уточнений.`
  }

  return `Осталось уточнений на уровне: ${task.progress.promptsRemaining} из ${task.progress.promptsLimit}`
}
