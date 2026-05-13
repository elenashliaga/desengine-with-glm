import type { LabScreenState, LevelOverview, TaskData, TaskListItem } from "@/lib/platform/types";
import { BaseProps } from "../../platform/Base";
type LabProps = BaseProps & {
    initLevelOverview: LevelOverview;
    initScreen: LabScreenState;
    initTaskItem: TaskListItem | null;
    initTaskData: TaskData | null;
}
export type { LabProps }
