import { z } from "zod"

const LlmProviderSchema = z.enum(["openai"])

// Схема конфигурации приложения (env/config.json)
const AppConfigSchema = z
  .object({
    taskCatalogRoot: z.string().optional(),
    tasksRoot: z.string().optional(),
    userRoot: z.string().optional(),
    userProgressFile: z.string().optional(),
    taskConfigFile: z.string(),
    taskImageFile: z.string(),
    llm: z.object({
      provider: LlmProviderSchema,
      openai: z.object({
        defaultModel: z.string().min(1),
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
  .superRefine((value, ctx) => {
    if (!value.taskCatalogRoot && !value.tasksRoot) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Нужно указать taskCatalogRoot или tasksRoot",
        path: ["taskCatalogRoot"],
      })
    }
  })
  .transform((value) => {
    const taskCatalogRoot = value.taskCatalogRoot ?? value.tasksRoot ?? "tasks"
    const userRoot = value.userRoot ?? "user"

    return {
      ...value,
      taskCatalogRoot,
      userRoot,
      userProgressFile: value.userProgressFile ?? `${userRoot}/user-progress.json`,
    }
  })

export type AppConfig = z.infer<typeof AppConfigSchema>

export { AppConfigSchema, LlmProviderSchema }
