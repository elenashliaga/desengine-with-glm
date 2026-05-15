import { BaseProps } from "@/components/desengine/system/Base";

type PromptControlsProps = BaseProps & {
    disabled?: boolean;
    pending?: boolean;
    onRun: () => void;
}

export { type PromptControlsProps }
