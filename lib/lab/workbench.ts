import "server-only"

type OutputFileDescriptor = {
  id: string
  fileName: string
}

const relativeImportPattern =
  /(?:import\s+[\s\S]*?\sfrom\s+|export\s+[\s\S]*?\sfrom\s+|import\s*\()\s*["'](\.[^"']+)["']/g

function stripKnownExtension(specifier: string) {
  return specifier.replace(/\.(tsx|ts|jsx|js)$/i, "")
}

function normalizeRelativeSpecifier(specifier: string) {
  return specifier.replace(/\\/g, "/").replace(/\/+/g, "/")
}

function hasDefaultComponentExport(fileName: string, content: string) {
  if (fileName !== "Component.tsx") {
    return true
  }

  return (
    /export\s+default\s+/m.test(content) ||
    /export\s+default\s+function\b/m.test(content) ||
    /export\s*\{\s*[^}]*\bComponent\b\s+as\s+default\b[^}]*\}/m.test(content)
  )
}

export function validateGeneratedFilesPayload(
  payload: Record<string, string | null>,
  outputFiles: OutputFileDescriptor[],
  allWorkbenchFiles: OutputFileDescriptor[],
  options?: {
    allowNull?: boolean
    allowBlankFileNames?: string[]
  },
) {
  const allowedFileNames = new Set(outputFiles.map((file) => file.fileName))
  const knownWorkbenchBySpecifier = new Map<string, string>()
  const allowBlankFileNames = new Set(options?.allowBlankFileNames ?? [])

  for (const file of allWorkbenchFiles) {
    const withoutExtension = stripKnownExtension(file.fileName)
    knownWorkbenchBySpecifier.set(`./${file.fileName}`, file.fileName)
    knownWorkbenchBySpecifier.set(`./${withoutExtension}`, file.fileName)
  }

  for (const file of outputFiles) {
    const rawContent = payload[file.id]

    if (rawContent === null && options?.allowNull) {
      continue
    }

    if (typeof rawContent !== "string") {
      throw new Error(`Ответ не содержит строковый контент для файла ${file.fileName}`)
    }

    const trimmed = rawContent.trim()
    if (!trimmed && !allowBlankFileNames.has(file.fileName)) {
      throw new Error(`Ответ вернул пустой контент для файла ${file.fileName}`)
    }

    if (!trimmed) {
      continue
    }

    if (trimmed === file.fileName || trimmed === file.id) {
      throw new Error(`Ответ вернул идентификатор вместо содержимого файла ${file.fileName}`)
    }

    if (!hasDefaultComponentExport(file.fileName, trimmed)) {
      throw new Error(`Файл ${file.fileName} не экспортирует React-компонент по умолчанию`)
    }

    const matches = [...trimmed.matchAll(relativeImportPattern)]
    for (const match of matches) {
      const specifier = normalizeRelativeSpecifier(match[1] ?? "")
      const resolvedWorkbenchFile = knownWorkbenchBySpecifier.get(specifier)

      if (!resolvedWorkbenchFile) {
        continue
      }

      if (!allowedFileNames.has(resolvedWorkbenchFile)) {
        throw new Error(
          `Файл ${file.fileName} ссылается на запрещённый локальный импорт ${specifier}`,
        )
      }
    }
  }
}
import "server-only"

import { access, rm } from "node:fs/promises"

import { appConfig } from "@/lib/config/server"
import { getUserTaskFilePath } from "@/lib/user/server"

type WorkbenchFile = (typeof appConfig.taskWorkbenchFiles)[number]

type FilteredWorkbenchPayloadEntry = {
  fileId: string
  fileName: string
  content: unknown
}

const editableWorkbenchFiles = appConfig.taskWorkbenchFiles.filter((file) => file.edit === true)
const editableWorkbenchFileIds = new Set(editableWorkbenchFiles.map((file) => file.id))

function normalizeEditableFileAllowlist(editableFileIds: string[]) {
  const allowlist = new Set<string>()

  for (const fileId of editableFileIds) {
    if (editableWorkbenchFileIds.has(fileId)) {
      allowlist.add(fileId)
    }
  }

  return allowlist
}

export function getLevelEditableWorkbenchFiles(editableFileIds: string[]): WorkbenchFile[] {
  const allowlist = normalizeEditableFileAllowlist(editableFileIds)
  return editableWorkbenchFiles.filter((file) => allowlist.has(file.id))
}

export function getLevelEditableWorkbenchFileMap(editableFileIds: string[]) {
  return new Map(
    getLevelEditableWorkbenchFiles(editableFileIds).map((file) => [file.id, file.fileName] as const),
  )
}

export function filterWorkbenchPayloadByAllowlist(
  payload: Record<string, unknown>,
  editableFileIds: string[],
) {
  const editableFileMap = getLevelEditableWorkbenchFileMap(editableFileIds)
  const allowedEntries: FilteredWorkbenchPayloadEntry[] = []
  const ignoredFileIds: string[] = []

  for (const [fileId, content] of Object.entries(payload)) {
    const fileName = editableFileMap.get(fileId)

    if (!fileName) {
      if (editableWorkbenchFileIds.has(fileId)) {
        ignoredFileIds.push(fileId)
      }
      continue
    }

    allowedEntries.push({ fileId, fileName, content })
  }

  return { allowedEntries, ignoredFileIds }
}

export async function cleanupForbiddenWorkbenchFiles(
  taskId: string,
  editableFileIds: string[],
) {
  const allowlist = normalizeEditableFileAllowlist(editableFileIds)
  const deletedFileIds: string[] = []
  const deletedFilePaths: string[] = []

  for (const file of editableWorkbenchFiles) {
    if (allowlist.has(file.id)) continue

    const filePath = getUserTaskFilePath(taskId, file.fileName)

    try {
      await access(filePath)
    } catch {
      continue
    }

    await rm(filePath, { force: true })
    deletedFileIds.push(file.id)
    deletedFilePaths.push(filePath)
  }

  return { deletedFileIds, deletedFilePaths }
}
