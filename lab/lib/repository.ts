import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config"
import {
  type TaskListItem,
       TaskConfigSchema,
  type TaskConfig,
  type TaskData,
} from "./types"

export async function getTaskListItems(): Promise<TaskListItem[]> {
  const entries = await readdir(appConfig.tasksRoot, { withFileTypes: true })
  const taskDirs = entries.filter((entry) => entry.isDirectory())

  const tasks = await Promise.all(
    taskDirs.map(async (entry) => {
      const taskId = entry.name

      const configPath = path.join(
        appConfig.tasksRoot,
        taskId,
        appConfig.taskConfigFile,
      )

      let taskConfig: TaskConfig;
      try {
        const rawTaskConfig = await readFile(configPath, "utf-8")
        const parsedTaskConfig = TaskConfigSchema.parse(JSON.parse(rawTaskConfig))
        taskConfig = {
          ...parsedTaskConfig,
          id: taskId,
        }
      } catch {
        // TODO Сейчас здесь все ошибки конфигурации свалены в одну кучу — исправить
        // ? Может, где-то отдельно держать дефолтовое значение?
        taskConfig = {
          id: taskId,
          image: {
            width: 10,
            height: 10,
          }
        }
      }

      return taskConfig;
    })
  )

  return tasks.sort((a, b) => a.id.localeCompare(b.id))
}

export async function readTaskData(task: TaskListItem): Promise<TaskData> {
  const entries = await Promise.all(
    // для каждого файла собрать путь
    // по пути прочитать контент
    // и вернуть пару «id файла, контент»
    appConfig.taskWorkbenchFiles.map(async (file) => {
      const filePath = path.join(
        appConfig.tasksRoot,
        task.id,
        file.fileName
      )

      const content = await readFile(filePath, "utf-8")

      return [file.id, content] as const
    })
  )

  return {
    taskId: task.id,
    contentByFileId: Object.fromEntries(entries),
  }
}