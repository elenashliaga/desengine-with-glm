import { BaseProps } from "../Base";
import type { TaskData, TaskListItem, TaskTransition } from "@/lib/types";

type LabWorkbenchProps = BaseProps & {
    taskItem: TaskListItem;
    taskData: TaskData;
    onTaskItemChange: (next: TaskListItem | null) => void;
    onTaskDataChange: (next: TaskData) => void;
    started: boolean;
    onStartedChange: (next: boolean) => void;
    onBackToLevelList: () => void;
    onTransition: (transition: TaskTransition | null) => void;
    activeScreen: string;
    onScreenChange: (screen: string) => void;
}

export { type LabWorkbenchProps }
