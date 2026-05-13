// @openSpec capability: user-progress
// @openSpec scenarios:
// @openSpec  - "Пользователь использует систему локально"
// @openSpec  - "Проверка завершилась техническим сбоем"
// @openSpec  - "Пользователь видит задачу после технического сбоя проверки"
// @openSpec  - "Исчерпан лимит содержательных проверок уровня"
// @openSpec  - "Уровень успешно завершён"
// @openSpec  - "Runtime читает локальный task-progress"
// @openSpec  - "Следующий уровень уже стал текущим, но ещё не начат"
// @openSpec  - "У задачи более высокий уровень"
// @openSpec  - "Пользователь сбрасывает задачу"
// @openSpec  - "Пользователь удалил каталог `user/`"
// @openSpec capability: task-levels
// @openSpec scenarios:
// @openSpec  - "Техническая ошибка проверки не расходует лимит"
// @openSpec  - "Последняя доступная проверка не пройдена"
// @openSpec  - "У задачи есть следующий уровень"

import { describe, expect, it } from "vitest"

import { summarizeTaskProgress } from "../../lib/task/task-progress-summary"
import type { LevelConfig } from "../../lib/level/types"
import type { TaskConfig, TaskProgress } from "../../lib/task/types"

const levels: LevelConfig[] = [
  {
    id: "level-1",
    number: 1,
    title: "Уровень 1",
    description: "Первый уровень",
    url: undefined,
    layoutKey: "level-1",
    maxPromptsPerTask: 3,
    maxCheckAttempts: 2,
    labId: "level-1",
    images: [{ id: "base", show: true }],
    editableFileIds: ["component"],
  },
  {
    id: "level-2",
    number: 2,
    title: "Уровень 2",
    description: "Второй уровень",
    url: undefined,
    layoutKey: "level-2",
    maxPromptsPerTask: 5,
    maxCheckAttempts: 3,
    labId: "level-2",
    images: [{ id: "base", show: true }],
    editableFileIds: ["component"],
  },
]

const taskConfig: TaskConfig = {
  image: { width: 100, height: 100 },
  base: { width: 100, height: 100 },
  variants: null,
  images: { base: { width: 100, height: 100 } },
  maxLevel: 2,
}

describe("summarizeTaskProgress", () => {
  it("явно помечает новый текущий уровень как ещё не начатый после прохождения предыдущего", () => {
    const taskProgress: TaskProgress = {
      currentLevel: 2,
      levels: {
        "1": {
          status: "completed",
          promptsUsed: 2,
          initializedAt: "2026-05-11T10:00:00.000Z",
          completedAt: "2026-05-11T10:05:00.000Z",
          checkAttemptsUsed: 1,
          checkingState: "idle",
        },
        "2": {
          status: "available",
          promptsUsed: 0,
          checkAttemptsUsed: 0,
          checkingState: "idle",
        },
      },
    }

    const summary = summarizeTaskProgress(levels, taskConfig, taskProgress)

    expect(summary.currentLevel).toBe(2)
    expect(summary.currentLevelStatus).toBe("available")
    expect(summary.currentLevelStarted).toBe(false)
    expect(summary.currentLevelNotStarted).toBe(true)
    expect(summary.currentLevelDisplayStatus).toBe("available")
    expect(summary.promptsRemaining).toBe(5)
    expect(summary.isCompleted).toBe(false)
  })

  it("не помечает текущий уровень как не начатый, если пользователь уже работал на нём", () => {
    const taskProgress: TaskProgress = {
      currentLevel: 2,
      levels: {
        "1": {
          status: "completed",
          promptsUsed: 2,
          initializedAt: "2026-05-11T10:00:00.000Z",
          completedAt: "2026-05-11T10:05:00.000Z",
          checkAttemptsUsed: 1,
          checkingState: "idle",
        },
        "2": {
          status: "in_progress",
          promptsUsed: 1,
          initializedAt: "2026-05-11T10:06:00.000Z",
          checkAttemptsUsed: 0,
          checkingState: "idle",
        },
      },
    }

    const summary = summarizeTaskProgress(levels, taskConfig, taskProgress)

    expect(summary.currentLevelStarted).toBe(true)
    expect(summary.currentLevelNotStarted).toBe(false)
    expect(summary.currentLevelDisplayStatus).toBe("in_progress")
    expect(summary.promptsRemaining).toBe(4)
  })

  it("отображает технический сбой проверки как awaiting-check без расхода попытки", () => {
    const taskProgress: TaskProgress = {
      currentLevel: 1,
      levels: {
        "1": {
          status: "in_progress",
          promptsUsed: 1,
          initializedAt: "2026-05-11T10:00:00.000Z",
          checkAttemptsUsed: 0,
          checkingState: "awaiting_retry",
        },
      },
    }

    const summary = summarizeTaskProgress(levels, taskConfig, taskProgress)

    expect(summary.currentLevelDisplayStatus).toBe("awaiting_check_retry")
    expect(summary.checkAttemptsUsed).toBe(0)
    expect(summary.checkingState).toBe("awaiting_retry")
    expect(summary.isCompleted).toBe(false)
  })

  it("ограничивает текущий уровень максимумом задачи после reset или отсутствия user-state", () => {
    const taskProgress: TaskProgress = {
      currentLevel: 999,
      levels: {},
    }

    const summary = summarizeTaskProgress(levels, taskConfig, taskProgress)

    expect(summary.currentLevel).toBe(2)
    expect(summary.currentLevelStarted).toBe(false)
    expect(summary.promptsUsed).toBe(0)
    expect(summary.checkAttemptsUsed).toBe(0)
  })

  it("показывает полное завершение только на максимальном завершённом уровне", () => {
    const taskProgress: TaskProgress = {
      currentLevel: 2,
      levels: {
        "2": {
          status: "completed",
          promptsUsed: 3,
          initializedAt: "2026-05-11T10:00:00.000Z",
          completedAt: "2026-05-11T10:30:00.000Z",
          checkAttemptsUsed: 2,
          checkingState: "idle",
        },
      },
    }

    const summary = summarizeTaskProgress(levels, taskConfig, taskProgress)

    expect(summary.isCompleted).toBe(true)
    expect(summary.hasNextLevel).toBe(false)
    expect(summary.checkAttemptsUsed).toBe(2)
  })
})
