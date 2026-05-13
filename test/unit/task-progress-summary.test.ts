import { describe, expect, it } from "vitest"

import { summarizeTaskProgress } from "../../lib/task/task-progress-summary"
import type { LevelConfig, TaskConfig, TaskProgress } from "../../lib/platform/types"

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
          completionReason: "check_passed",
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
          completionReason: "check_passed",
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
})
