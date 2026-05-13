import type { LevelConfig } from "../../lib/level/types"
import type { TaskConfig, TaskProgress } from "../../lib/task/types"

const taskProgressLevels: LevelConfig[] = [
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

const taskProgressConfig: TaskConfig = {
  image: { width: 100, height: 100 },
  base: { width: 100, height: 100 },
  variants: null,
  images: { base: { width: 100, height: 100 } },
  maxLevel: 2,
}

const taskProgressAfterLevelCompletion: TaskProgress = {
  currentLevel: 2,
  updatedAt: "2026-05-13T12:00:00.000Z",
  levels: {
    "1": {
      status: "completed",
      promptsUsed: 2,
      initializedAt: "2026-05-13T11:00:00.000Z",
      completedAt: "2026-05-13T11:30:00.000Z",
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

export { taskProgressAfterLevelCompletion, taskProgressConfig, taskProgressLevels }
