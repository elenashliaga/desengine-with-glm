import { z } from "zod"

const CheckingStateSchema = z.enum(["idle", "awaiting_retry"])

const TaskImageSchema = z.object({
  width: z.number(),
  height: z.number(),
})

const TaskConfigRawSchema = z.object({
  images: z
    .object({
      base: TaskImageSchema,
      variants: TaskImageSchema.optional(),
    })
    .catchall(TaskImageSchema),

  maxLevel: z.number().int().min(1),
})

const TaskConfigSchema = TaskConfigRawSchema.transform((value) => {
  const base = value.images.base
  const variants = value.images.variants ?? null

  return {
    image: base,
    base,
    variants,
    images: value.images,
    maxLevel: value.maxLevel,
  }
})

const TaskLevelProgressSchema = z.object({
  status: z.enum(["available", "in_progress", "completed"]),
  isPassed: z.boolean().optional(),
  promptsUsed: z.number().int().min(0),
  initializedAt: z.string().optional(),
  completedAt: z.string().optional(),
  checkAttemptsUsed: z.number().int().min(0).optional(),
  checkingState: CheckingStateSchema.optional(),
})

const TaskProgressSchema = z.object({
  currentLevel: z.number().int().min(1),
  levels: z.record(z.string(), TaskLevelProgressSchema),
  updatedAt: z.string().optional(),
})

export {
    TaskImageSchema,
    TaskConfigRawSchema,
    TaskConfigSchema,
    TaskLevelProgressSchema,
    TaskProgressSchema,
    CheckingStateSchema,
}
