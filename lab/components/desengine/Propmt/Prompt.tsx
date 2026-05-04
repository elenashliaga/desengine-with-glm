import { useMemo, useState } from "react";
import { PromptFileList } from "./PromptFile";
import { PromptText } from "./PromptText";
import { PromptControls } from "./PromptControls";
import { BaseProps, BaseStyles } from "../Base";
import { taskWorkbenchFiles } from "@/lib/client";
import type { TaskData } from "@/lib/types";

type PromptProps = BaseProps & {
    taskId: string;
    taskData: TaskData;
    started: boolean;
    onTaskDataChange: (next: TaskData) => void;
    onIterationApplied: () => void;
}

function Prompt({ taskId, taskData, started, onTaskDataChange, onIterationApplied }: PromptProps) {
    const [promptText, setPromptText] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    const editableFileIds = useMemo(
      () => taskWorkbenchFiles.filter((file) => file.edit === true).map((file) => file.id),
      [],
    )
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>(editableFileIds);

    function handleToggle(fileId: string, checked: boolean) {
        setSelectedFileIds((current) => {
            if (checked) {
                return current.includes(fileId) ? current : [...current, fileId];
            }

            return current.filter((id) => id !== fileId);
        });
    }

    async function handleRun() {
        setStatus("");
        setError("");

        if (!started) {
            setError("Сначала запустите задачу");
            return;
        }

        if (!promptText.trim()) {
            setError("Введите уточняющий промпт");
            return;
        }

        setPending(true);

        const res = await fetch(`/api/tasks/${taskId}/iterate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                prompt: promptText,
                selectedFileIds,
            }),
        });

        const data = await res.json().catch(() => null);
        setPending(false);

        if (!res.ok || !data?.ok) {
            setError(data?.error || "Ошибка запуска итерации");
            return;
        }

        onTaskDataChange(data.taskData);
        onIterationApplied();
        setPromptText("");
        setStatus("Уточнение применено");
    }

    return (
        <div className="space-y-3">
            <div className={`${BaseStyles.frameRow} h-64`}>
            <PromptText value={promptText} disabled={!started || pending} onChange={setPromptText} />
            <div className="flex flex-2 flex-col h-full">
                <PromptFileList
                  selectedFileIds={selectedFileIds}
                  disabled={!started || pending}
                  onToggle={handleToggle}
                />
                <PromptControls disabled={!started} pending={pending} onRun={handleRun} />
            </div>
            </div>

            {status && <p className="text-sm text-muted-foreground">{status}</p>}
            {error && <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">{error}</pre>}

            <div className="space-y-2">
                <p className="text-sm font-medium">История уточнений</p>
                {taskData.promptHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Пока пусто</p>
                ) : (
                    <div className="space-y-2">
                        {taskData.promptHistory.slice().reverse().map((entry) => (
                            <div key={`${entry.createdAt}-${entry.text}`} className="rounded-md border p-3 text-sm">
                                <p className="text-muted-foreground">{entry.createdAt}</p>
                                <p className="whitespace-pre-wrap">{entry.text}</p>
                                <p className="text-muted-foreground">
                                  Файлы: {entry.selectedFileIds.length ? entry.selectedFileIds.join(", ") : "все"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export {
 Prompt,
    type PromptProps
}
