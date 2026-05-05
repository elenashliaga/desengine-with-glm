import "server-only"

import { appConfig } from "./config.server"
import {
  appendPromptHistory,
  isTaskStarted,
  readPromptHistory,
  readTaskData,
} from "./repository"
import {
  completeCurrentTaskLevel,
  getAllLevelOverviews,
  getLevelById,
  getLevelForTaskItem,
  getLevelOverview,
  getLevelsCatalog,
  getTaskLabContext,
  getTaskListItemById,
  getTaskListItemsWithProgress,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  registerPromptForCurrentLevel,
} from "./task-levels.server"

export {
  appConfig,
  appendPromptHistory,
  completeCurrentTaskLevel,
  getAllLevelOverviews,
  getLevelById,
  getLevelForTaskItem,
  getLevelOverview,
  getLevelsCatalog,
  getTaskLabContext,
  getTaskListItemById,
  getTaskListItemsWithProgress as getTaskListItems,
  isTaskStarted,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  readPromptHistory,
  readTaskData,
  registerPromptForCurrentLevel,
}
