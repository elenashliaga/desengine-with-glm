import { BaseProps } from "../Base";
import type { TaskData } from "@/lib/types";

type InOutProps = BaseProps & {
    task: string;
    taskData: TaskData;
    started: boolean;
    reloadKey: number;
    startStatus: "" | "starting";
}

export { type InOutProps }
