import { BaseProps } from "../Base";
import { TaskData, TaskListItem } from "@/lib";

type LabWorkbenchProps = BaseProps & {
    taskItem: TaskListItem;
    taskData: TaskData;
    onTaskDataChange: null;
}

export { type LabWorkbenchProps }