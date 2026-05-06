import { type KeyboardEvent } from "react";
import { PromptControls } from "../PromptControls";
import { PromptText } from "../PromptText";

type PromptComposerProps = {
    value: string;
    disabled?: boolean;
    pending?: boolean;
    runDisabled?: boolean;
    onChange: (value: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    onRun: () => void;
}

function PromptComposer({
    value,
    disabled,
    pending,
    runDisabled,
    onChange,
    onKeyDown,
    onRun,
}: PromptComposerProps) {
    return (
        <div className="bg-black text-white">
            <div className="mx-auto w-full max-w-7xl px-4 py-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 text-foreground shadow-sm">
                        <PromptText
                          value={value}
                          disabled={disabled}
                          onChange={onChange}
                          onKeyDown={onKeyDown}
                        />
                        <PromptControls disabled={runDisabled} pending={pending} onRun={onRun} />
                    </div>
                    <p className="text-xs text-white/70">
                        Enter отправляет запрос, Shift+Enter добавляет перенос строки.
                    </p>
                </div>
            </div>
        </div>
    );
}

export {
    PromptComposer,
    type PromptComposerProps,
}
