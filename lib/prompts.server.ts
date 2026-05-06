import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"

type PromptName = "start-component" | "iterate-component"
type PromptKind = "production" | "didactic"

export async function readPrompt(kind: PromptKind, name: PromptName) {
  const root = kind === "production" ? appConfig.productionPromptsRoot : appConfig.didacticPromptsRoot
  const filePath = path.join(root, `${name}.md`)
  return readFile(filePath, "utf-8")
}

export async function readLevelDidacticPrompt(promptKey: string) {
  const filePath = path.join(appConfig.didacticPromptsRoot, "levels", `${promptKey}.md`)

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    return ""
  }
}

export async function readLevelInitPrompt(levelId: string, fallbackPromptKey?: string) {
  const filePath = path.join(appConfig.levelsCatalogRoot, levelId, "init-prompt.md")

  try {
    return await readFile(filePath, "utf-8")
  } catch {
    if (fallbackPromptKey) {
      return readLevelDidacticPrompt(fallbackPromptKey)
    }

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
