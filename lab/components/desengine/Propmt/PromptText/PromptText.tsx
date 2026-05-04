import { Textarea } from "@/components/ui/textarea";

type PromptTextProps = {
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}

function PromptText({ value, disabled, onChange }: PromptTextProps) {
    return (
        <div className="flex-6 h-full">
            <Textarea
              id="prompt"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Опиши, что нужно уточнить или исправить"
              className="w-full h-full"
            />
        </div>
    );
}
export {
    PromptText,
    type PromptTextProps
}
