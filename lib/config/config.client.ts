import type { AppConfig } from "@/lib/config/config.schema"

import { appConfigSource } from "@/lib/config/app-config.shared"

// Конфиг для client components: без node:fs и без нормализации путей.
// Если понадобится tasksRoot на клиенте, добавим отдельный контракт.
const appConfigClient = appConfigSource as unknown as AppConfig

export const taskWorkbenchFiles = appConfigClient.taskWorkbenchFiles
