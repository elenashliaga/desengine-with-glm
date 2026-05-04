import { access, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"
import {
  type PromptHistoryEntry,
  type TaskData,
} from "./types"

const promptHistoryFileName = "prompt-history.json"

export async function readTaskData(task: { id: string }): Promise<TaskData> {
  const textFiles = appConfig.taskWorkbenchFiles.filter((file) => {
    // На MVP не читаем бинарные файлы (PNG).
    return !file.fileName.toLowerCase().endsWith(".png")
  })

  const entries = await Promise.all(
    // для каждого файла собрать путь
    // по пути прочитать контент
    // и вернуть пару «id файла, контент»
    textFiles.map(async (file) => {
      const filePath = path.join(
        appConfig.tasksRoot,
        task.id,
        file.fileName
      )

      const content = await readFile(filePath, "utf-8").catch(() => "")

      return [file.id, content] as const
    })
  )

  const promptHistory = await readPromptHistory(task.id)

  return {
    taskId: task.id,
    contentByFileId: Object.fromEntries(entries),
    promptHistory,
  }
}

export async function isTaskStarted(taskId: string): Promise<boolean> {
  const componentFile = appConfig.taskWorkbenchFiles.find((f) => f.id === "component")
  if (!componentFile) return false

  const filePath = path.join(appConfig.tasksRoot, taskId, componentFile.fileName)
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function getPromptHistoryPath(taskId: string) {
  return path.join(appConfig.tasksRoot, taskId, promptHistoryFileName)
}

export async function readPromptHistory(taskId: string): Promise<PromptHistoryEntry[]> {
  const filePath = getPromptHistoryPath(taskId)

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is PromptHistoryEntry => {
      return (
        entry &&
        typeof entry.text === "string" &&
        typeof entry.createdAt === "string" &&
        Array.isArray(entry.selectedFileIds) &&
        (typeof entry.levelNumber === "number" || typeof entry.levelNumber === "undefined") &&
        entry.selectedFileIds.every((item: unknown) => typeof item === "string")
      )
    })
  } catch {
    return []
  }
}

export async function appendPromptHistory(taskId: string, entry: PromptHistoryEntry) {
  const history = await readPromptHistory(taskId)
  history.push(entry)
  await writeFile(getPromptHistoryPath(taskId), JSON.stringify(history, null, 2), "utf-8")
}
