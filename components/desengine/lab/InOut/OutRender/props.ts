import { BaseProps } from "@/components/desengine/system/Base";

type OutRenderProps = BaseProps & {
    task: string;
    started: boolean;
    reloadKey: number;
    startStatus: "" | "starting";
}

export { type OutRenderProps }
