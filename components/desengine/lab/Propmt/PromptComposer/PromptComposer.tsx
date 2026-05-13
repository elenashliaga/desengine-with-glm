import { type KeyboardEvent } from "react";
import { PromptControls } from "../PromptControls";
import { PromptText } from "../PromptText";

type PromptComposerProps = {
    value: string;
    promptsUsed: number;
    promptsLimit: number;
    teachingCostCents: number;
    disabled?: boolean;
    pending?: boolean;
    runDisabled?: boolean;
    onChange: (value: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    onRun: () => void;
}

function PromptComposer({
    value,
    promptsUsed,
    promptsLimit,
    teachingCostCents,
    disabled,
    pending,
    runDisabled,
    onChange,
    onKeyDown,
    onRun,
}: PromptComposerProps) {
    const spentUsd = (teachingCostCents / 100).toFixed(2);

    return (
        <div className="bg-black text-white">
            <div className="mx-auto w-full max-w-7xl px-4 py-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 text-foreground shadow-sm">
                        <div className="shrink-0 rounded-xl bg-black px-3 py-2 text-sm text-white">
                            <p className="whitespace-nowrap">Уточнения {promptsUsed} из {promptsLimit}</p>
                            <p className="whitespace-nowrap">Траты {spentUsd}$</p>
                        </div>
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
