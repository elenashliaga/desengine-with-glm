import path from "node:path"
import { appConfig } from "@/lib/config.server"

export function getTaskDir(taskKey: string) {
  return path.join(appConfig.tasksRoot, taskKey)
}
