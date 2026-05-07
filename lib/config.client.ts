import type { AppConfig } from "./config.schema"

import { appConfigSource } from "./app-config.shared"

// Конфиг для client components: без node:fs и без нормализации путей.
// Если понадобится tasksRoot на клиенте, добавим отдельный контракт.
const appConfigClient = appConfigSource as unknown as AppConfig

export const taskWorkbenchFiles = appConfigClient.taskWorkbenchFiles
