import { describe, expect, it } from "vitest"

import {
  getIndicatorWidth,
  getLevelBadgeText,
  getPromptRemainderText,
  getStatusText,
} from "../../lib/task/task-progress-presentation"
import type { TaskListItem } from "../../lib/platform/types"

function createTask(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: "button-primary",
    image: { width: 120, height: 40 },
    started: true,
    maxLevel: 3,
    progress: {
      currentLevel: 2,
      currentLevelId: "level-2",
      currentLevelStatus: "available",
      currentLevelDisplayStatus: "available",
      currentLevelStarted: false,
      currentLevelNotStarted: true,
      promptsUsed: 0,
      promptsLimit: 5,
      promptsRemaining: 5,
      checkAttemptsUsed: 0,
      checkAttemptsLimit: 3,
      checkingState: "idle",
      maxLevel: 3,
      isCompleted: false,
      hasNextLevel: true,
      completionReason: null,
    },
    ...overrides,
  }
}

describe("task progress presentation", () => {
  it("показывает отдельный текст для нового текущего уровня, который ещё не начат", () => {
    const task = createTask()

    expect(getStatusText(task)).toBe("Уровень 2 из 3 ещё не начат")
    expect(getPromptRemainderText(task)).toBe(
      "Новый текущий уровень ещё не начат. После старта будет доступно 5 уточнений.",
    )
    expect(getLevelBadgeText(task)).toBe("lvl 2")
    expect(getIndicatorWidth(task)).toBe("66.66666666666666%")
  })

  it("сохраняет штатные статусы для задачи, которая уже идёт", () => {
    const task = createTask({
      progress: {
        ...createTask().progress,
        currentLevelStatus: "in_progress",
        currentLevelDisplayStatus: "in_progress",
        currentLevelStarted: true,
        currentLevelNotStarted: false,
        promptsUsed: 2,
        promptsRemaining: 3,
      },
    })

    expect(getStatusText(task)).toBe("Уровень 2 из 3")
    expect(getPromptRemainderText(task)).toBe("Осталось уточнений на уровне: 3 из 5")
    expect(getLevelBadgeText(task)).toBe("lvl 2")
  })
})
