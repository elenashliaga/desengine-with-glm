import type { TaskData } from "@/lib/types";
import { BaseProps } from "../Base";

type CodeProps = BaseProps & {
    taskData: TaskData;
    onTaskDataChange?: (next: TaskData) => void;
    activeFileId?: string;
    onActiveFileIdChange?: (next: string) => void;
}

export { type CodeProps }
