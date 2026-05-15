import { describe, expect, it } from "vitest"

import { isEditorSaveHotkey } from "../../lib/lab/editor"

describe("isEditorSaveHotkey", () => {
  it("считает Cmd+S горячей клавишей сохранения", () => {
    expect(isEditorSaveHotkey({ key: "s", metaKey: true, ctrlKey: false })).toBe(true)
  })

  it("считает Ctrl+S горячей клавишей сохранения", () => {
    expect(isEditorSaveHotkey({ key: "S", metaKey: false, ctrlKey: true })).toBe(true)
  })

  it("не считает другие сочетания горячей клавишей сохранения", () => {
    expect(isEditorSaveHotkey({ key: "p", metaKey: true, ctrlKey: false })).toBe(false)
  })
})
