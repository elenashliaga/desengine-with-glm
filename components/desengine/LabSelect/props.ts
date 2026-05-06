import { TaskListItem } from "@/lib/types";
import { BaseProps } from "../Base";

type LabSelectProps = BaseProps & {
    taskListItems: TaskListItem[];
    currentTaskId: string;
    onTaskChange: (taskId: string) => void;
}

export { type LabSelectProps }