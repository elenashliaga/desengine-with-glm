import { BaseProps } from "../../Base";
import type { TaskData } from "@/lib/platform/types";

type InPictureProps = BaseProps & {
    task: string;
    taskData: TaskData;
}

export {
    type InPictureProps,
}
