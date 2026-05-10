import type { TaskData, TaskListItem } from "@/lib/types"

type TaskLevelStartProps = {
  taskItem: TaskListItem
  taskData: TaskData
  startStatus: "" | "starting"
  startError: string
  onStart: () => void
  onBackToLevelList: () => void
}

export { type TaskLevelStartProps }
