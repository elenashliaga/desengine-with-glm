import "server-only"

import { access, mkdir, rm } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"
import type { UserProgressStore } from "./types"

const promptHistoryFileName = "prompt-history.json"

function defaultUserProgressStore(): UserProgressStore {
  return { tasks: {} }
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function ensureDir(targetPath: string) {
  await mkdir(targetPath, { recursive: true })
}

async function ensureParentDir(targetPath: string) {
  await ensureDir(path.dirname(targetPath))
}

export function getTaskCatalogDir(taskId: string) {
  return path.join(appConfig.taskCatalogRoot, taskId)
}

export function getTaskCatalogFilePath(taskId: string, fileName: string) {
  return path.join(getTaskCatalogDir(taskId), fileName)
}

export function getUserTasksRoot() {
  return path.join(appConfig.userRoot, "tasks")
}

export function getUserTaskDir(taskId: string) {
  return path.join(getUserTasksRoot(), taskId)
}

export function getUserTaskFilePath(taskId: string, fileName: string) {
  return path.join(getUserTaskDir(taskId), fileName)
}

export async function ensureUserRoot() {
  await ensureDir(appConfig.userRoot)
}

export async function ensureUserTaskDir(taskId: string) {
  await ensureDir(getUserTaskDir(taskId))
}

export async function ensureUserProgressStorage() {
  await ensureParentDir(appConfig.userProgressFile)
}

export async function removeUserTaskDir(taskId: string) {
  const taskDir = getUserTaskDir(taskId)

  await rm(taskDir, {
    recursive: true,
    force: true,
  })

  if (await pathExists(taskDir)) {
    throw new Error(`Не удалось удалить пользовательский каталог задачи: ${taskDir}`)
  }
}

export { defaultUserProgressStore, ensureParentDir, pathExists, promptHistoryFileName }
