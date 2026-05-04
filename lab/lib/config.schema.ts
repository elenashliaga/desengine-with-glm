import { z } from "zod"

const LlmProviderSchema = z.enum(["openai", "ollama"])

// Схема конфигурации приложения (env/config.json)
const AppConfigSchema = z.object({
  tasksRoot: z.string(),
  userProgressFile: z.string(),
  taskConfigFile: z.string(),
  taskImageFile: z.string(),
  llm: z.object({
    provider: LlmProviderSchema,
    openai: z.object({
      defaultModel: z.string().min(1),
    }),
    ollama: z.object({
      defaultBaseUrl: z.string().min(1),
    }),
  }),
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

export { AppConfigSchema, LlmProviderSchema }
