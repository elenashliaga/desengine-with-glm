import { z } from "zod"

const TaskConfigSchema = z.object({
  image: z.object({
    width: z.number(),
    height: z.number(),
  }),
})

type TaskConfig = z.infer<typeof TaskConfigSchema>

type TaskListItem = {
  id: string
  image: TaskConfig["image"]
  started: boolean
}

export type PromptHistoryEntry = {
  text: string
  createdAt: string
  selectedFileIds: string[]
}

// все файлы
// ? Тут точно нужен taskId?
export type TaskData = {
  taskId: string
  contentByFileId: Record<string, string>
  promptHistory: PromptHistoryEntry[]
}

export {
    type TaskListItem,
    type TaskConfig,
    TaskConfigSchema,
}
