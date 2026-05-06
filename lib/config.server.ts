import "server-only"

import fs from "node:fs"
import path from "node:path"

import { AppConfigSchema, type AppConfig } from "./config.schema"

const raw = fs.readFileSync(path.join(process.cwd(), "env/config.json"), "utf-8")
const parsed = AppConfigSchema.parse(JSON.parse(raw))

// Нормализация путей для project data и user state.
const appConfig: AppConfig = {
  ...parsed,
  taskCatalogRoot: path.resolve(process.cwd(), parsed.taskCatalogRoot),
  userRoot: path.resolve(process.cwd(), parsed.userRoot),
  userProgressFile: path.resolve(process.cwd(), parsed.userProgressFile),
}

export { appConfig }
