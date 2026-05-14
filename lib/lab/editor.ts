export function applyFileContentChange(
  currentContentByFileId: Record<string, string>,
  fileId: string,
  nextValue: string,
): Record<string, string> {
  return {
    ...currentContentByFileId,
    [fileId]: nextValue,
  }
}
export type SaveHotkeyEvent = {
  key: string
  metaKey: boolean
  ctrlKey: boolean
}

export function isEditorSaveHotkey(event: SaveHotkeyEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s"
}
