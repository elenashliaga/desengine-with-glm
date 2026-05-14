// @openSpec capability: level-labs
// @openSpec scenarios:
// @openSpec  - "Пользователь вводит первый символ в чистом файле"
// @openSpec  - "Пользователь впервые вставляет текст в чистый файл"

import { describe, expect, it } from "vitest"

import { applyFileContentChange } from "../../lib/lab/editor"

describe("applyFileContentChange", () => {
  it("сохраняет первый введённый символ", () => {
    const next = applyFileContentChange({ component: "" }, "component", "a")
    expect(next.component).toBe("a")
  })

  it("сохраняет первую вставку текста целиком", () => {
    const snippet = "<button>Кнопка</button>"
    const next = applyFileContentChange({ component: "" }, "component", snippet)
    expect(next.component).toBe(snippet)
  })

  it("использует текущее локальное состояние, а не устаревший слепок", () => {
    const staleSnapshot = { component: "" }
    const current = applyFileContentChange(staleSnapshot, "component", "a")
    const next = applyFileContentChange(current, "component", "ab")
    expect(staleSnapshot.component).toBe("")
    expect(next.component).toBe("ab")
  })
})
