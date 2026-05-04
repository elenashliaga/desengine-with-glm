import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

type PromptName = "start-component" | "iterate-component"
type PromptKind = "production" | "didactic"

export async function readPrompt(kind: PromptKind, name: PromptName) {
  const filePath = path.join(process.cwd(), "prompts", kind, `${name}.md`)
  return readFile(filePath, "utf-8")
}
