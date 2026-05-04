import type { AppConfig } from "./config.schema"

import rawConfig from "@/env/config.json"

// Конфиг для client components: без node:fs и без нормализации путей.
// Если понадобится tasksRoot на клиенте, добавим отдельный контракт.
const appConfigClient = rawConfig as unknown as AppConfig

export const taskWorkbenchFiles = appConfigClient.taskWorkbenchFiles

