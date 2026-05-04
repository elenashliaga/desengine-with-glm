import { BaseProps } from "../Base";

type InOutProps = BaseProps & {
    task: string;
    started: boolean;
    reloadKey: number;
    onStart: () => void;
    startStatus: "" | "starting" | "error";
    startError: string;
}

export { type InOutProps }
