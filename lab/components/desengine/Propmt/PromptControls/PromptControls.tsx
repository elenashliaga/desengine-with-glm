import { PromptControlsProps } from "./props";
import { Button } from "@/components/ui/button";

function PromptControls({}: PromptControlsProps) {
    return (
        <Button className="mt-auto">Запустить →</Button>
    );
}
export {
    PromptControls,
}