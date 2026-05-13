import { z } from "zod"

import { UserProgressStoreSchema } from "./schema"

type UserProgressStore = z.infer<typeof UserProgressStoreSchema>

export type {
    UserProgressStore,
}
