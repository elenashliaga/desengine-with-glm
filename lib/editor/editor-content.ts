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
