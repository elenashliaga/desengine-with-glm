// @openSpec capability: component-file-set
// @openSpec scenarios:
// @openSpec  - "Пользователь запускает итерацию по заданию"
// @openSpec  - "На уровне запрещён `styles`"
// @openSpec  - "На диске остался запрещённый рабочий файл"
// @openSpec  - "Пользователь запускает уточнение"
// @openSpec capability: iteration
// @openSpec scenarios:
// @openSpec  - "Модель изменила только часть файлов"
// @openSpec  - "LLM вернул запрещённый `fileId`"

import { describe, expect, it } from "vitest"
import { vi } from "vitest"

vi.mock("server-only", () => ({}))

import { validateGeneratedFilesPayload } from "../../lib/lab/workbench"

const allWorkbenchFiles = [
  { id: "component", fileName: "Component.tsx" },
  { id: "stories", fileName: "Component.stories.tsx" },
  { id: "styles", fileName: "styles.ts" },
]

describe("validateGeneratedFilesPayload", () => {
  it("принимает null для файла, который LLM не меняет в уточнении", () => {
    expect(() =>
      validateGeneratedFilesPayload(
        {
          component: "export default function Component() { return null }",
          stories: null,
        },
        allWorkbenchFiles.slice(0, 2),
        allWorkbenchFiles,
        { allowNull: true },
      ),
    ).not.toThrow()
  })

  it("запрещает импорт рабочего файла, которого нет в allowlist уровня", () => {
    expect(() =>
      validateGeneratedFilesPayload(
        {
          component: 'import styles from "./styles";\nexport default function Component() { return null }',
          stories: "export {};",
        },
        allWorkbenchFiles.slice(0, 2),
        allWorkbenchFiles,
      ),
    ).toThrow("Файл Component.tsx ссылается на запрещённый локальный импорт ./styles")
  })

  it("не принимает идентификатор файла вместо содержимого", () => {
    expect(() =>
      validateGeneratedFilesPayload(
        {
          component: "component",
          stories: "export {};",
        },
        allWorkbenchFiles.slice(0, 2),
        allWorkbenchFiles,
      ),
    ).toThrow("Ответ вернул идентификатор вместо содержимого файла Component.tsx")
  })
})
