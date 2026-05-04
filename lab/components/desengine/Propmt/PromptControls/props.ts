import { BaseProps } from "../../Base";

type PromptControlsProps = BaseProps & {
    disabled?: boolean;
    pending?: boolean;
    onRun: () => void;
}

export { type PromptControlsProps }
