import { z } from "zod"

const LlmProviderSchema = z.enum(["openai"])

// Схема конфигурации приложения (desengine.config.json)
const AppConfigSchema = z
  .object({
    onboardingRoot: z.string().optional(),
    levelsCatalogRoot: z.string().optional(),
    taskCatalogRoot: z.string().optional(),
    tasksRoot: z.string().optional(),
    onboardingPromptsRoot: z.string().optional(),
    didacticPromptsRoot: z.string().optional(),
    promptsRoot: z.string().optional(),
    productionPromptsRoot: z.string().optional(),
    userRoot: z.string().optional(),
    userProgressFile: z.string().optional(),
    taskConfigFile: z.string(),
    taskImageFile: z.string(),
    llm: z.object({
      provider: LlmProviderSchema,
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
    const onboardingRoot = value.onboardingRoot ?? "onboarding"
    const taskCatalogRoot = value.taskCatalogRoot ?? value.tasksRoot ?? `${onboardingRoot}/tasks`
    const levelsCatalogRoot = value.levelsCatalogRoot ?? `${onboardingRoot}/levels`
    const onboardingPromptsRoot =
      value.onboardingPromptsRoot ?? value.didacticPromptsRoot ?? `${onboardingRoot}/prompts`
    const promptsRoot = value.promptsRoot ?? value.productionPromptsRoot ?? "prompts"
    const userRoot = value.userRoot ?? "user"

    return {
      ...value,
      onboardingRoot,
      levelsCatalogRoot,
      taskCatalogRoot,
      onboardingPromptsRoot,
      promptsRoot,
      userRoot,
      userProgressFile: value.userProgressFile ?? `${userRoot}/user-progress.json`,
    }
  })

export type AppConfig = z.infer<typeof AppConfigSchema>

export { AppConfigSchema, LlmProviderSchema }
