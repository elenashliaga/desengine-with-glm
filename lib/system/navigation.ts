import { appConfigSource } from "@/lib/config/app"
import { getTasksRootUrl } from "../task/navigation"

const editableTaskScreens = appConfigSource.taskWorkbenchFiles
  .filter((file) => file.edit)
  .map((file) => file.id)

const editableTaskScreenSet = new Set(editableTaskScreens)

const DEFAULT_TASK_SCREEN = "component"










export function getDefaultTaskScreen() {
  return DEFAULT_TASK_SCREEN
}

export function isKnownTaskScreen(screen: string) {
  return editableTaskScreenSet.has(screen)
}

export function isAccessibleTaskScreen(screen: string, allowedScreens: string[]) {
  return allowedScreens.includes(screen) && isKnownTaskScreen(screen)
}





// ? И тогда зачем эти функции?
export function createTaskNextPath(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}/next`
}

export function createTaskDonePath(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}/done`
}

export function createTaskCheckPath(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}/check`
}

export function createLabUrl(taskId: string, screen?: string) {
  const base = `/lab/${encodeURIComponent(taskId)}`
  return screen ? `${base}/${screen}` : base
}

export function createLevelsPath(levelId?: string) {
  if (!levelId) return "/levels"
  return `/levels/${encodeURIComponent(levelId)}`
}



