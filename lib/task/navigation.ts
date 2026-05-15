/** Корневой URL-адрес для всех задач */
function getTasksRootUrl() {
  return `/tasks`
}

/** URL-адрес информационной страницы конкретной задачи */
function getTaskUrl(taskId: string) {
  const tasksRootUrl = getTasksRootUrl();
  return `${tasksRootUrl}/${encodeURIComponent(taskId)}`
}


export {
    getTasksRootUrl,
    getTaskUrl,
}