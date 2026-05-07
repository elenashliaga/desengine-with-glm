import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"

type PromptName = "default" | "iterate-component" | "start-component"
type PromptKind = "production" | "didactic"

export async function readPrompt(kind: PromptKind, name: PromptName) {
  const root = kind === "production" ? appConfig.promptsRoot : appConfig.onboardingPromptsRoot
  const filePath = path.join(root, `${name}.md`)
  return readFile(filePath, "utf-8")
}

export async function readLevelSpecifyPrompt(levelId: string) {
  const filePath = path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "specify.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    return ""
  }
}

export async function readLevelInitPrompt(levelId: string) {
  const filePath = path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "init.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    throw new Error(`Инициирующий промпт уровня не найден: ${levelId}`)
  }
}

export async function readLevelCommonExplanation(levelId: string, fallbackText?: string) {
  const filePath = path.join(appConfig.levelsCatalogRoot, levelId, "overview.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    if (fallbackText) {
      return fallbackText
    }

    throw new Error(`Общее пояснение уровня не найдено: ${levelId}`)
  }
}
