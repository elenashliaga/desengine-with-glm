import { BaseProps } from "../../Base";
import type { TaskData } from "@/lib/types";

type InPictureProps = BaseProps & {
    task: string;
    taskData: TaskData;
}

export {
    type InPictureProps,
}
