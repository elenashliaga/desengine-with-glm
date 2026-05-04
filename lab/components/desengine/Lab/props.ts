import type { TaskData, TaskListItem } from "@/lib/types";
import { BaseProps } from "../Base";
type LabProps = BaseProps & {
    initTaskItem: TaskListItem;
    initTaskData: TaskData;
    taskListItems: TaskListItem[];
}
export type { LabProps }
