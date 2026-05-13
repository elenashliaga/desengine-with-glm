import { type KeyboardEvent, useLayoutEffect, useRef } from "react";

const PROMPT_LINE_HEIGHT = 24;
const PROMPT_MAX_ROWS = 3;
const PROMPT_VERTICAL_PADDING = 12;
const PROMPT_MAX_HEIGHT = PROMPT_LINE_HEIGHT * PROMPT_MAX_ROWS + PROMPT_VERTICAL_PADDING;

type PromptTextProps = {
    value: string;
    disabled?: boolean;
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    onChange: (value: string) => void;
}

function PromptText({ value, disabled, onKeyDown, onChange }: PromptTextProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = "0px";
        const nextHeight = Math.min(textarea.scrollHeight, PROMPT_MAX_HEIGHT);
        textarea.style.height = `${Math.max(nextHeight, PROMPT_LINE_HEIGHT + PROMPT_VERTICAL_PADDING)}px`;
        textarea.style.overflowY = textarea.scrollHeight > PROMPT_MAX_HEIGHT ? "auto" : "hidden";
    }, [value]);

    return (
        <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              id="prompt"
              rows={1}
              value={value}
              disabled={disabled}
              onKeyDown={onKeyDown}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Опиши, что нужно уточнить или исправить"
              className="block w-full resize-none border-0 bg-transparent px-0 py-1.5 text-base leading-6 text-black caret-black outline-none placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    );
}
export {
    PromptText,
    type PromptTextProps
}
