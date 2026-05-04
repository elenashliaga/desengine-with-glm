import { PromptControlsProps } from "./props";
import { Button } from "@/components/ui/button";

function PromptControls({ disabled, pending, onRun }: PromptControlsProps) {
    return (
        <Button className="mt-auto" disabled={disabled || pending} onClick={onRun}>
          {pending ? "Запуск…" : "Запустить →"}
        </Button>
    );
}
export {
    PromptControls,
}
