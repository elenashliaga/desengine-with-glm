import { BaseProps } from "@/components/desengine/platform/Base";

type PromptControlsProps = BaseProps & {
    disabled?: boolean;
    pending?: boolean;
    onRun: () => void;
}

export { type PromptControlsProps }
