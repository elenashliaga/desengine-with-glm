import path from "node:path"
import { appConfig } from "@/lib/config/config.server"

export function getTaskDir(taskKey: string) {
  return path.join(appConfig.taskCatalogRoot, taskKey)
}
