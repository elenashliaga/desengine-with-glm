import type { TaskData, TaskListItem } from "@/lib/system/types"
import type { BaseProps } from "../system/Base"

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
