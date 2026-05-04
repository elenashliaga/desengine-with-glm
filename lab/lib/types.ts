import { z } from "zod"

// тип выводится из схемы
const TaskConfigSchema = z.object({
    id: z.string(),
    image: {
        width: z.number(),
        height: z.number(),
    },
})

type TaskConfig = z.infer<typeof TaskConfigSchema>

type TaskListItem = {
  id: string
}

// все файлы
// ? Тут точно нужен taskId?
export type TaskData = {
  taskId: string
  contentByFileId: Record<string, string>
}

export {
    type TaskListItem,
    type TaskConfig,
    TaskConfigSchema,
}
