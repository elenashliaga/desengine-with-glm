import { BaseProps } from "@/components/desengine/platform/Base";

type OutRenderProps = BaseProps & {
    task: string;
    started: boolean;
    reloadKey: number;
    startStatus: "" | "starting";
}

export { type OutRenderProps }
