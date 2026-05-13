import { z } from "zod"

import type { TaskListItem } from "../task/types"

import {
    LevelConfigSchema,
    LevelsCatalogSchema,
} from "./schema"


type LevelConfig = z.infer<typeof LevelConfigSchema>
type LevelsCatalog = z.infer<typeof LevelsCatalogSchema>

type LevelOverviewTaskItem = TaskListItem & {
  nextUnlockedLevel: number | null
}

type LevelOverview = {
  level: LevelConfig
  availableTasks: LevelOverviewTaskItem[]
  passedTasks: LevelOverviewTaskItem[]
  prevLevelId: string | null
  nextLevelId: string | null
}

export type {
    LevelConfig,
    LevelsCatalog,
    LevelOverviewTaskItem,
    LevelOverview,
}