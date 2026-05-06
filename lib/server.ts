import "server-only"

import { appConfig } from "./config.server"
import {
  appendPromptHistory,
  isTaskStarted,
  readPromptHistory,
  readTaskData,
} from "./repository"
import {
  cleanupForbiddenWorkbenchFiles,
  filterWorkbenchPayloadByAllowlist,
  getLevelEditableWorkbenchFileMap,
  getLevelEditableWorkbenchFiles,
} from "./task-workbench.server"
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
  getTaskPendingTransition,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  resetTask,
  registerPromptForCurrentLevel,
} from "./task-levels.server"

export {
  appConfig,
  appendPromptHistory,
  cleanupForbiddenWorkbenchFiles,
  completeCurrentTaskLevel,
  filterWorkbenchPayloadByAllowlist,
  getAllLevelOverviews,
  getLevelById,
  getLevelForTaskItem,
  getLevelOverview,
  getLevelsCatalog,
  getLevelEditableWorkbenchFileMap,
  getLevelEditableWorkbenchFiles,
  getTaskLabContext,
  getTaskListItemById,
  getTaskListItemsWithProgress as getTaskListItems,
  getTaskPendingTransition,
  isTaskStarted,
  markCurrentTaskLevelInitialized,
  markTaskLevelInProgress,
  readPromptHistory,
  readTaskData,
  resetTask,
  registerPromptForCurrentLevel,
}
