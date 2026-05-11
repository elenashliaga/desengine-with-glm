import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  collectSnapshotSecretViolations,
  sanitizePromptHistoryForSnapshot,
} from "./snapshot.server"
import type { PromptHistoryEntry, SnapshotFileEntry } from "./types"

describe("snapshot publishing", () => {
  it("убирает внутреннюю llm-телеметрию из истории слепка", () => {
    const promptHistory: PromptHistoryEntry[] = [
      {
        text: "Сделай карточку плотнее",
        createdAt: "2026-05-11T10:00:00.000Z",
        displayCreatedAt: "2026-05-11 12:00:00",
        iterationNumber: 2,
        levelNumber: 1,
        selectedFileNames: ["Component.tsx"],
        changedFileNames: ["styles.ts"],
        llmCall: {
          provider: "openai",
          model: "gpt-5",
          metrics: {
            status: "available",
            inputTokens: 10,
            outputTokens: 5,
            totalTokens: 15,
            costUsd: null,
          },
        },
      },
    ]

    expect(sanitizePromptHistoryForSnapshot(promptHistory)).toEqual([
      {
        text: "Сделай карточку плотнее",
        createdAt: "2026-05-11T10:00:00.000Z",
        displayCreatedAt: "2026-05-11 12:00:00",
        iterationNumber: 2,
        levelNumber: 1,
        selectedFileNames: ["Component.tsx"],
        changedFileNames: ["styles.ts"],
      },
    ])
  })

  it("находит типичный API-ключ в файле", () => {
    const files: SnapshotFileEntry[] = [
      {
        fileId: "component",
        fileName: "Component.tsx",
        content: "export const token = 'sk-proj-1234567890abcdefghijklmnop'",
      },
    ]

    const violations = collectSnapshotSecretViolations(files, [])

    expect(violations.some((item) => item.ruleId === "openai-api-key")).toBe(true)
    expect(violations.every((item) => item.sourceLabel === "Component.tsx")).toBe(true)
  })

  it("находит bearer-токен в истории промптов", () => {
    const violations = collectSnapshotSecretViolations(
      [],
      [
        {
          text: "Используй Authorization: Bearer super-secret-token-value",
          createdAt: "2026-05-11T10:00:00.000Z",
          iterationNumber: 3,
        },
      ],
    )

    expect(violations).toEqual([
      {
        sourceType: "prompt",
        sourceLabel: "Запрос #3",
        ruleId: "bearer-token",
      },
    ])
  })

  it("не считает обычный безопасный промпт секретом", () => {
    const violations = collectSnapshotSecretViolations(
      [
        {
          fileId: "component",
          fileName: "Component.tsx",
          content: "export function Component() { return <div>ok</div> }",
        },
      ],
      [
        {
          text: "Сделай карточку визуально легче и уменьшай отступы",
          createdAt: "2026-05-11T10:00:00.000Z",
          iterationNumber: 1,
        },
      ],
    )

    expect(violations).toEqual([])
  })
})
