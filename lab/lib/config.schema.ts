import { z } from "zod"

// Схема конфигурации приложения (env/config.json)
const AppConfigSchema = z.object({
  tasksRoot: z.string(),
  taskConfigFile: z.string(),
  taskImageFile: z.string(),
  taskWorkbenchFiles: z.array(
    z.object({
      id: z.string(),
      fileName: z.string(),
      title: z.string(),
      edit: z.boolean(),
    }),
  ),
})

export type AppConfig = z.infer<typeof AppConfigSchema>

export { AppConfigSchema }

