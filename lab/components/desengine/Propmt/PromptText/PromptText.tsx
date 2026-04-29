import { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";

type PromptTextProps = {
    title?: string;
    children?: ReactNode;
}

function PromptText({}: PromptTextProps) {
    return (
        <div className="flex-6 h-full">
            <Textarea id="prompt" placeholder="Полный текст промпта"  className="w-full h-full"/>
        </div>
    );
}
export {
    PromptText,
    type PromptTextProps
}