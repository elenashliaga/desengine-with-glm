import type { UserProgressStore } from "../../lib/platform/types"

const FIXTURE_NOW = "2026-05-13T12:00:00.000Z"

const emptyUserProgressStore: UserProgressStore = {
  tasks: {},
}

const userProgressWithStartedTask: UserProgressStore = {
  tasks: {
    "button-primary": {
      currentLevel: 1,
      updatedAt: FIXTURE_NOW,
      levels: {
        "1": {
          status: "in_progress",
          promptsUsed: 1,
          initializedAt: "2026-05-13T11:55:00.000Z",
          checkAttemptsUsed: 0,
          checkingState: "idle",
        },
      },
    },
  },
}

const userProgressAwaitingRetry: UserProgressStore = {
  tasks: {
    "button-primary": {
      currentLevel: 1,
      updatedAt: FIXTURE_NOW,
      levels: {
        "1": {
          status: "in_progress",
          promptsUsed: 2,
          initializedAt: "2026-05-13T11:50:00.000Z",
          checkAttemptsUsed: 1,
          checkingState: "awaiting_retry",
        },
      },
    },
  },
}

export { FIXTURE_NOW, emptyUserProgressStore, userProgressAwaitingRetry, userProgressWithStartedTask }
