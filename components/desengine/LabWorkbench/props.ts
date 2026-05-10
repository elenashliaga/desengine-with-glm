import { BaseProps } from "../Base";
import type { TaskCheckResult, TaskData, TaskListItem, TaskTransition } from "@/lib/types";

type LabWorkbenchProps = BaseProps & {
    taskItem: TaskListItem;
    taskData: TaskData;
    onTaskItemChange: (next: TaskListItem | null) => void;
    onTaskDataChange: (next: TaskData) => void;
    onBackToLevelList: () => void;
    onCheckResult: (result: TaskCheckResult, transition: TaskTransition | null, nextTaskItem: TaskListItem | null, nextTaskData: TaskData) => void;
    onTransition: (transition: TaskTransition | null) => void;
    activeScreen: string;
    onScreenChange: (screen: string) => void;
}

export { type LabWorkbenchProps }
