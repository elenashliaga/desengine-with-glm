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
