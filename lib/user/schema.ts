import { z } from "zod"
import { TaskProgressSchema } from "@/lib/task/schema"

const UserProgressStoreSchema = z.object({
  tasks: z.record(z.string(), TaskProgressSchema),
})

export {
    UserProgressStoreSchema,
}
