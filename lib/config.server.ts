import "server-only"

import fs from "node:fs"
import path from "node:path"

import { AppConfigSchema, type AppConfig } from "./config.schema"

const raw = fs.readFileSync(path.join(process.cwd(), "env/config.json"), "utf-8")
const parsed = AppConfigSchema.parse(JSON.parse(raw))

// Нормализация (на MVP нужен абсолютный путь до tasksRoot)
const appConfig: AppConfig = {
  ...parsed,
  tasksRoot: path.resolve(process.cwd(), parsed.tasksRoot),
  userProgressFile: path.resolve(process.cwd(), parsed.userProgressFile),
}

export { appConfig }
