import { z } from "zod"

const LevelImageConfigSchema = z.object({
  id: z.string().min(1),
  show: z.boolean(),
})

const LevelConfigSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().optional(),
  layoutKey: z.string().min(1),
  maxPromptsPerTask: z.number().int().min(1),
  maxCheckAttempts: z.number().int().min(1).optional(),
  labId: z.string().min(1).optional(),
  images: z.array(LevelImageConfigSchema).optional(),
  editableFileIds: z.array(z.string().min(1)).optional(),
}).transform((value) => {
  const defaultImages =
    value.number === 1
      ? [{ id: "base", show: true }]
      : [
          { id: "base", show: true },
          { id: "variants", show: true },
        ]

  const defaultEditableFileIds =
    value.number === 1
      ? ["component", "stories"]
      : value.number === 2
        ? ["component", "stories", "styles"]
        : ["component", "stories", "styles", "mock", "props"]

  return {
    ...value,
    url: value.url?.trim() ? value.url.trim() : undefined,
    labId: value.labId ?? (value.number === 1 ? "level-1" : value.number === 2 ? "level-2" : "shared-lab"),
    maxCheckAttempts: value.maxCheckAttempts ?? 3,
    images: value.images ?? defaultImages,
    editableFileIds: value.editableFileIds ?? defaultEditableFileIds,
  }
})

const LevelsCatalogSchema = z.object({
  levels: z.array(LevelConfigSchema).min(1),
})

export {
    LevelImageConfigSchema,
    LevelConfigSchema,
    LevelsCatalogSchema,
}