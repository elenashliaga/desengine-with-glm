import type { LabScreenState, LevelOverview, TaskData, TaskListItem } from "@/lib/types";
import { BaseProps } from "../Base";
type LabProps = BaseProps & {
    initLevelOverview: LevelOverview;
    initScreen: LabScreenState;
    initTaskItem: TaskListItem | null;
    initTaskData: TaskData | null;
}
export type { LabProps }
