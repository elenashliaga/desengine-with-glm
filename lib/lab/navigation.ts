/** Лабораторные адреса */

/** Корневой адрес для всех лабораторий */
function getLabRootUrl() {
  return `/lab`
}

/** URL к конкретной лаборатории (задача с точностью до экрана) */
function getLabUrl(taskId: string, screen?: string | null) {
  const labRootUrl = getLabRootUrl();
  if (!screen || screen === DEFAULT_TASK_SCREEN) {
    return `${labRootUrl}/${encodeURIComponent(taskId)}`
  }

  return `${labRootUrl}/${encodeURIComponent(taskId)}/${encodeURIComponent(screen)}`
}

export {
    getLabRootUrl,
    getLabUrl
}