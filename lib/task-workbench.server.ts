import "server-only"

import { access, rm } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "./config.server"

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

    const filePath = path.join(appConfig.tasksRoot, taskId, file.fileName)

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
