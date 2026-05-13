import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "@/lib/config/config.server"

import type { PromptKind, PromptName } from "./types"

export async function readPrompt(kind: PromptKind, name: PromptName) {
  const root = kind === "production" ? appConfig.promptsRoot : appConfig.onboardingPromptsRoot
  const filePath = path.join(root, `${name}.md`)
  return readFile(filePath, "utf-8")
}

export async function readLevelIteratePrompt(levelId: string) {
  const filePath = path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "iterate.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    return ""
  }
}

export async function readLevelStartPrompt(levelId: string) {
  const filePath = path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "start.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    throw new Error(`Стартовый промпт уровня не найден: ${levelId}`)
  }
}

export async function readLevelCheckPrompt(levelId: string) {
  const filePath = path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "check.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    throw new Error(`Промпт проверки уровня не найден: ${levelId}`)
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
