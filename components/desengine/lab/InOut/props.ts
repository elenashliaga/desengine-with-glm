import { BaseProps } from "@/components/desengine/platform/Base";
import type { TaskData } from "@/lib/platform/types";

type InOutProps = BaseProps & {
    task: string;
    taskData: TaskData;
    started: boolean;
    reloadKey: number;
    startStatus: "" | "starting";
}

export { type InOutProps }
