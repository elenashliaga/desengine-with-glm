import { appConfigSource } from "@/lib/config/app"

const editableTaskScreens = appConfigSource.taskWorkbenchFiles
  .filter((file) => file.edit)
  .map((file) => file.id)

const editableTaskScreenSet = new Set(editableTaskScreens)

const DEFAULT_TASK_SCREEN = "component"

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function getDefaultTaskScreen() {
  return DEFAULT_TASK_SCREEN
}

export function isKnownTaskScreen(screen: string) {
  return editableTaskScreenSet.has(screen)
}

export function isAccessibleTaskScreen(screen: string, allowedScreens: string[]) {
  return allowedScreens.includes(screen) && isKnownTaskScreen(screen)
}

export function createTasksPath() {
  return "/tasks"
}


/** Лабораторные адреса */

/** URL к задаче в лаборатории (с точностью до экрана) */
export function createLabUrl(taskId: string, screen?: string | null) {
  if (!screen || screen === DEFAULT_TASK_SCREEN) {
    return `/tasks/${encodeURIComponent(taskId)}`
  }

  return `/tasks/${encodeURIComponent(taskId)}/${encodeURIComponent(screen)}`
}

export function createTaskNextPath(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}/next`
}

export function createTaskDonePath(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}/done`
}

export function createTaskCheckPath(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}/check`
}

export function createLevelsPath(levelId?: string | null) {
  if (!levelId) {
    return "/levels"
  }

  return `/levels/${encodeURIComponent(levelId)}`
}

export function createLevelAssetPath(levelId: string, assetPath?: string | null) {
  const basePath = `/api/levels/${encodeURIComponent(levelId)}/assets`

  if (!assetPath) {
    return basePath
  }

  const normalizedAssetPath = assetPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return normalizedAssetPath ? `${basePath}/${normalizedAssetPath}` : basePath
}

export function createAuthPath() {
  return "/auth"
}

export function createLabPath() {
  return "/lab"
}

export function createAccessPreparePath(returnTo: string) {
  return `/api/access/prepare?returnTo=${encodeURIComponent(returnTo)}`
}

export function createConfigPath() {
  return "/config"
}

export function createHelpPath() {
  return "/help"
}

export function isProtectedPath(pathname: string) {
  const normalized = normalizePathname(pathname)
  return normalized === "/tasks"
    || normalized.startsWith("/tasks/")
    || normalized === "/levels"
    || normalized.startsWith("/levels/")
}

export function sanitizeReturnPath(pathname: string | null | undefined) {
  if (!pathname || typeof pathname !== "string") {
    return null
  }

  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return null
  }

  if (pathname.includes("?") || pathname.includes("#")) {
    return null
  }

  const normalized = normalizePathname(pathname)

  if (normalized === "/") {
    return createTasksPath()
  }

  if (!isProtectedPath(normalized)) {
    return null
  }

  return normalized
}
