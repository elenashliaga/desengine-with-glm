import { PromptControlsProps } from "./props";
import { Button } from "@/components/ui/button";

function PromptControls({ disabled, pending, onRun }: PromptControlsProps) {
    return (
        <Button className="shrink-0 self-end rounded-xl px-5" disabled={disabled || pending} onClick={onRun}>
          {pending ? "Запуск…" : "Запустить →"}
        </Button>
    );
}
export {
    PromptControls,
}
