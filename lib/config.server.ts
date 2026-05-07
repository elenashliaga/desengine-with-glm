import "server-only"

import path from "node:path"
import { fileURLToPath } from "node:url"

import { appConfigSource } from "./app-config.shared"
import { AppConfigSchema, type AppConfig } from "./config.schema"

const parsed = AppConfigSchema.parse(appConfigSource)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// Нормализация путей для project data и user state.
const appConfig: AppConfig = {
  ...parsed,
  onboardingRoot: path.resolve(repoRoot, parsed.onboardingRoot),
  levelsCatalogRoot: path.resolve(repoRoot, parsed.levelsCatalogRoot),
  taskCatalogRoot: path.resolve(repoRoot, parsed.taskCatalogRoot),
  onboardingPromptsRoot: path.resolve(repoRoot, parsed.onboardingPromptsRoot),
  promptsRoot: path.resolve(repoRoot, parsed.promptsRoot),
  userRoot: path.resolve(repoRoot, parsed.userRoot),
  userProgressFile: path.resolve(repoRoot, parsed.userProgressFile),
}

export { appConfig }
