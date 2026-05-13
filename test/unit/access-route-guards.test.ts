// @openSpec capability: access-control
// @openSpec scenarios:
// @openSpec  - "Защищённая страница открывается через route-файл"
// @openSpec  - "UI-компонент рендерится внутри защищённого маршрута"

import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

function walkFiles(dirPath: string, predicate: (filePath: string) => boolean, result: string[] = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, result)
      continue
    }

    if (entry.isFile() && predicate(entryPath)) {
      result.push(entryPath)
    }
  }

  return result
}

describe("route-level access guards", () => {
  it("защищённые route entry points используют route-level guard", () => {
    const routeFiles = [
      "app/page.tsx",
      "app/tasks/page.tsx",
      "app/levels/page.tsx",
      "app/help/page.tsx",
      "app/tasks/[taskId]/page.tsx",
      "app/tasks/[taskId]/[screen]/page.tsx",
      "app/tasks/[taskId]/check/page.tsx",
      "app/tasks/[taskId]/done/page.tsx",
      "app/tasks/[taskId]/next/page.tsx",
      "app/levels/[levelId]/page.tsx",
    ]

    for (const filePath of routeFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), filePath), "utf8")

      expect(source, filePath).toContain("requireAccessOrRedirect")
    }
  })

  it("компонентный слой не вызывает redirect guard повторно", () => {
    const componentFiles = walkFiles(
      path.join(process.cwd(), "components"),
      (filePath) => /\.(ts|tsx)$/.test(filePath),
    )

    for (const filePath of componentFiles) {
      const source = fs.readFileSync(filePath, "utf8")

      expect(source, path.relative(process.cwd(), filePath)).not.toContain("requireAccessOrRedirect")
    }
  })
})
