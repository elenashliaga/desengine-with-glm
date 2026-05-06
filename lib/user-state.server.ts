import "server-only"

import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"
import { UserProgressStoreSchema, type UserProgressStore } from "./types"

const promptHistoryFileName = "prompt-history.json"
const legacyUserProgressFile = path.join(process.cwd(), "env", "user-progress.json")
const legacyMigrationStateFile = path.join(process.cwd(), "env", ".user-state-migrated.json")
const editableWorkbenchFiles = appConfig.taskWorkbenchFiles.filter((file) => file.edit)

type LegacyMigrationState = {
  progress: boolean
  tasks: string[]
}

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

async function readLegacyUserProgressStore() {
  try {
    const raw = await readFile(legacyUserProgressFile, "utf-8")
    return UserProgressStoreSchema.parse(JSON.parse(raw))
  } catch {
    return defaultUserProgressStore()
  }
}

async function readLegacyMigrationState(): Promise<LegacyMigrationState> {
  try {
    const raw = await readFile(legacyMigrationStateFile, "utf-8")
    const parsed = JSON.parse(raw)

    return {
      progress: parsed?.progress === true,
      tasks: Array.isArray(parsed?.tasks)
        ? parsed.tasks.filter((taskId: unknown): taskId is string => typeof taskId === "string")
        : [],
    }
  } catch {
    return {
      progress: false,
      tasks: [],
    }
  }
}

async function writeLegacyMigrationState(state: LegacyMigrationState) {
  await ensureParentDir(legacyMigrationStateFile)
  await writeFile(legacyMigrationStateFile, JSON.stringify(state, null, 2), "utf-8")
}

function getLegacyTaskDir(taskId: string) {
  return path.join(appConfig.taskCatalogRoot, taskId)
}

function getLegacyPromptHistoryPath(taskId: string) {
  return path.join(getLegacyTaskDir(taskId), promptHistoryFileName)
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

export async function cleanupLegacyTaskStateOnReset(taskId: string) {
  const legacyTaskDir = getLegacyTaskDir(taskId)
  const legacyProgressStore = await readLegacyUserProgressStore()

  const legacyUserFileNames = new Set<string>([
    promptHistoryFileName,
    ...editableWorkbenchFiles.map((file) => file.fileName),
  ])

  await Promise.all(
    [...legacyUserFileNames].map(async (fileName) => {
      await rm(path.join(legacyTaskDir, fileName), {
        force: true,
        recursive: true,
      })
    }),
  )

  if (legacyProgressStore.tasks[taskId]) {
    delete legacyProgressStore.tasks[taskId]
    await ensureParentDir(legacyUserProgressFile)
    await writeFile(legacyUserProgressFile, JSON.stringify(legacyProgressStore, null, 2), "utf-8")
  }
}

export async function migrateLegacyUserProgressIfNeeded() {
  const migrationState = await readLegacyMigrationState()
  if (migrationState.progress) {
    return
  }

  if (await pathExists(appConfig.userProgressFile)) {
    return
  }

  if (!(await pathExists(legacyUserProgressFile))) {
    return
  }

  const store = await readLegacyUserProgressStore()
  await ensureUserProgressStorage()
  await writeFile(appConfig.userProgressFile, JSON.stringify(store, null, 2), "utf-8")
  await writeLegacyMigrationState({
    ...migrationState,
    progress: true,
  })
}

export async function migrateLegacyTaskStateIfNeeded(taskId: string) {
  const migrationState = await readLegacyMigrationState()
  if (migrationState.tasks.includes(taskId)) {
    return
  }

  const [legacyStore, hasLegacyPromptHistory] = await Promise.all([
    readLegacyUserProgressStore(),
    pathExists(getLegacyPromptHistoryPath(taskId)),
  ])

  const hasLegacyTaskState = hasLegacyPromptHistory || Boolean(legacyStore.tasks[taskId])
  if (!hasLegacyTaskState) {
    return
  }

  await ensureUserTaskDir(taskId)

  const copyOperations: Promise<void>[] = []

  for (const file of editableWorkbenchFiles) {
    const targetPath = getUserTaskFilePath(taskId, file.fileName)
    const sourcePath = getTaskCatalogFilePath(taskId, file.fileName)

    copyOperations.push(
      (async () => {
        if (await pathExists(targetPath)) return
        if (!(await pathExists(sourcePath))) return
        await copyFile(sourcePath, targetPath)
      })(),
    )
  }

  copyOperations.push(
    (async () => {
      const targetPath = getUserTaskFilePath(taskId, promptHistoryFileName)
      const sourcePath = getLegacyPromptHistoryPath(taskId)
      if (await pathExists(targetPath)) return
      if (!(await pathExists(sourcePath))) return
      await copyFile(sourcePath, targetPath)
    })(),
  )

  await Promise.all(copyOperations)
  await writeLegacyMigrationState({
    ...migrationState,
    tasks: [...new Set([...migrationState.tasks, taskId])],
  })
}

export { defaultUserProgressStore, ensureParentDir, pathExists, promptHistoryFileName }
