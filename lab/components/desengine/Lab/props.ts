import { TaskData, TaskListItem } from "@/lib";
import { BaseProps } from "../Base";
type LabProps = BaseProps & {
    initTaskItem: TaskListItem;
    initTaskData: TaskData;
    taskListItems: TaskListItem[];
}
export type { LabProps }