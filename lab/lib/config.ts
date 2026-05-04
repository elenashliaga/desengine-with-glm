import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

// схема
// ? Может, анализировать реальный файл, а не зашивать схему в код?
const AppConfigSchema = z.object({
  tasksRoot:          z.string(),
  taskConfigFile:     z.string(),
  taskImageFile:      z.string(),
  taskWorkbenchFiles: z.array(
    z.object({
      id:       z.string(),
      fileName: z.string(),
      title:    z.string(),
      edit:     z.boolean(),
    })
  ),
})

// тип выводится из схемы
export type AppConfig = z.infer<typeof AppConfigSchema>

// чтение файла
const raw = fs.readFileSync(
  path.join(process.cwd(), "env/config.json"),
  "utf-8"
)

// парсинг + валидация
const parsed = AppConfigSchema.parse(JSON.parse(raw))

// нормализация (пока только один абсолютный путь)
const appConfig: AppConfig = {
  ...parsed,
  tasksRoot: path.resolve(process.cwd(), parsed.tasksRoot),
}

export { appConfig }