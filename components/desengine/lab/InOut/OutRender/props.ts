import { BaseProps } from "../../Base";

type OutRenderProps = BaseProps & {
    task: string;
    started: boolean;
    reloadKey: number;
    startStatus: "" | "starting";
}

export { type OutRenderProps }
