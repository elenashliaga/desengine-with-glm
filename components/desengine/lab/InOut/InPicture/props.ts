import { BaseProps } from "@/components/desengine/system/Base";
import type { TaskData } from "@/lib/system/types";

type InPictureProps = BaseProps & {
    task: string;
    taskData: TaskData;
}

export {
    type InPictureProps,
}
