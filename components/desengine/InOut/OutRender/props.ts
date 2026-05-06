import { BaseProps } from "../../Base";

type OutRenderProps = BaseProps & {
    task: string;
    started: boolean;
    reloadKey: number;
    onStart: () => void;
    startStatus: "" | "starting" | "error";
    startError: string;
}

export { type OutRenderProps }
