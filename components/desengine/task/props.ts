import type { TaskData, TaskListItem } from "@/lib/platform/types"
import type { BaseProps } from "../platform/Base"

type TaskItemProps = BaseProps & {
    task: TaskListItem
}

type TaskItemListProps = BaseProps & {
  tasks: TaskListItem[]
}

type TaskLevelStartProps = {
  taskItem: TaskListItem
  taskData: TaskData
  startStatus: "" | "starting"
  startError: string
  onStart: () => void
  onBackToLevelList: () => void
}

export type {
  TaskLevelStartProps,
  TaskItemListProps,
  TaskItemProps,
}
