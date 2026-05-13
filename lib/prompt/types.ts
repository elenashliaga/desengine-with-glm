import type { LlmCallRecord } from "../llm/types"

type PromptName = "default" | "iterate-component" | "start-component"
type PromptKind = "production" | "didactic"

type PromptHistoryEntry = {
  text: string
  createdAt: string
  displayCreatedAt?: string
  iterationNumber?: number
  levelNumber?: number
  selectedFileNames?: string[]
  changedFileIds?: string[]
  changedFileNames?: string[]
  teachingCostCents?: number
  llmCall?: LlmCallRecord
}

export type {
  PromptName,
  PromptKind,
  PromptHistoryEntry,
}