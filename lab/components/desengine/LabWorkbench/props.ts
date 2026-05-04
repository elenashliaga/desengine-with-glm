import { BaseProps } from "../Base";
import type { TaskData, TaskListItem } from "@/lib/types";

type LabWorkbenchProps = BaseProps & {
    taskItem: TaskListItem;
    taskData: TaskData;
    onTaskDataChange: (next: TaskData) => void;
    started: boolean;
    onStartedChange: (next: boolean) => void;
}

export { type LabWorkbenchProps }
