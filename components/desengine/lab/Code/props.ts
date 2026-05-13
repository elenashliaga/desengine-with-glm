import type { TaskData } from "@/lib/platform/types";
import { BaseProps } from "../Base";

type CodeProps = BaseProps & {
    taskData: TaskData;
    onTaskDataChange?: (next: TaskData) => void;
    onFileChange?: (fileId: string, nextValue: string) => void;
    onSaveShortcut?: () => void;
    activeFileId?: string;
    onActiveFileIdChange?: (next: string) => void;
    dirtyFileIds?: string[];
}

export { type CodeProps }
