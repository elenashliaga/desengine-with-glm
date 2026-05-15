import type { LabScreenState, LevelOverview, TaskData, TaskListItem } from "@/lib/system/types";
import { BaseProps } from "../../system/Base";
type LabProps = BaseProps & {
    initLevelOverview: LevelOverview;
    initScreen: LabScreenState;
    initTaskItem: TaskListItem | null;
    initTaskData: TaskData | null;
}
export type { LabProps }
