export type SaveHotkeyEvent = {
  key: string
  metaKey: boolean
  ctrlKey: boolean
}

export function isEditorSaveHotkey(event: SaveHotkeyEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s"
}
