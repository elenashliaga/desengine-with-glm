import { useMemo, useState } from "react";
import { PromptFileList } from "./PromptFile";
import { PromptText } from "./PromptText";
import { PromptControls } from "./PromptControls";
import { BaseProps, BaseStyles } from "../Base";
import { taskWorkbenchFiles } from "@/lib/client";
import type { TaskData, TaskListItem, TaskTransition } from "@/lib/types";

type PromptProps = BaseProps & {
    taskId: string;
    taskItem: TaskListItem;
    taskData: TaskData;
    started: boolean;
    onTaskItemChange: (next: TaskListItem | null) => void;
    onTaskDataChange: (next: TaskData) => void;
    onTransition: (transition: TaskTransition | null) => void;
    onIterationApplied: () => void;
}

function Prompt({
    taskId,
    taskItem,
    taskData,
    started,
    onTaskItemChange,
    onTaskDataChange,
    onTransition,
    onIterationApplied,
}: PromptProps) {
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

        if (!taskItem.progress.currentLevelInitialized) {
            setError("Сначала дождитесь инициирующего запуска текущего уровня");
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

        onTaskItemChange(data.taskItem ?? null);
        onTaskDataChange(data.taskData);
        onTransition(data.transition ?? null);
        onIterationApplied();
        setPromptText("");
        setStatus("Уточнение применено");
    }

    return (
        <div className="space-y-3">
            <div className={`${BaseStyles.frameRow} h-64`}>
            <PromptText value={promptText} disabled={!started || pending || !taskItem.progress.currentLevelInitialized} onChange={setPromptText} />
            <div className="flex flex-2 flex-col h-full">
                <PromptFileList
                  selectedFileIds={selectedFileIds}
                  disabled={!started || pending || !taskItem.progress.currentLevelInitialized}
                  onToggle={handleToggle}
                />
                <PromptControls disabled={!started || !taskItem.progress.currentLevelInitialized} pending={pending} onRun={handleRun} />
            </div>
            </div>

            {status && <p className="text-sm text-muted-foreground">{status}</p>}
            {error && <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">{error}</pre>}
            <p className="text-sm text-muted-foreground">
                Осталось промптов на этом уровне: {Math.max(taskItem.progress.promptsLimit - taskItem.progress.promptsUsed, 0)}
            </p>
            {!taskItem.progress.currentLevelInitialized && (
                <p className="text-sm text-muted-foreground">
                    Система сначала выполняет скрытый инициирующий запуск этого уровня. Уточняющие промпты станут доступны после него.
                </p>
            )}

            <div className="rounded-md border p-3 text-sm">
                <p>
                    <strong>Учебная стоимость:</strong> {taskData.llmUsageSummary.teachingCostCents} центов.
                </p>
                <p className="text-muted-foreground">
                    Это отдельный учебный индикатор и не заменяет реальные метрики провайдера.
                </p>
                <p className="mt-2">
                    <strong>Реальные метрики LLM:</strong>{" "}
                    {taskData.llmUsageSummary.totalCalls === 0
                      ? "ещё не накоплены."
                      : taskData.llmUsageSummary.totalTokens === null
                        ? "провайдер не вернул токеновые данные."
                        : `всего токенов ${taskData.llmUsageSummary.totalTokens} (вход: ${taskData.llmUsageSummary.inputTokens ?? "н/д"}, выход: ${taskData.llmUsageSummary.outputTokens ?? "н/д"}).`}
                </p>
                {taskData.llmUsageSummary.providersUsed.length > 0 && (
                    <p className="text-muted-foreground">
                        Провайдеры в истории: {taskData.llmUsageSummary.providersUsed.join(", ")}.
                        {taskData.llmUsageSummary.callsWithoutProviderMetrics > 0
                          ? ` Запусков без метрик: ${taskData.llmUsageSummary.callsWithoutProviderMetrics}.`
                          : ""}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">История уточнений</p>
                {taskData.promptHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Пока пусто</p>
                ) : (
                    <div className="space-y-2">
                        {taskData.promptHistory.map((entry) => (
                            <div key={`${entry.createdAt}-${entry.text}`} className="rounded-md border p-3 text-sm">
                                <p className="text-muted-foreground">{entry.createdAt}</p>
                                <p className="text-muted-foreground">
                                  Уровень: {entry.levelNumber ?? "не указан"}
                                </p>
                                <p className="whitespace-pre-wrap">{entry.text}</p>
                                <p className="text-muted-foreground">
                                  Файлы: {entry.selectedFileIds.length ? entry.selectedFileIds.join(", ") : "все"}
                                </p>
                                <p className="text-muted-foreground">
                                  Изменены: {entry.changedFileIds?.length ? entry.changedFileIds.join(", ") : "нет изменений"}
                                </p>
                                {entry.llmCall && (
                                    <p className="text-muted-foreground">
                                      LLM: {entry.llmCall.provider} / {entry.llmCall.model}.{" "}
                                      {entry.llmCall.metrics.status === "available"
                                        ? `Токены: ${entry.llmCall.metrics.totalTokens ?? "н/д"}`
                                        : "Метрики не возвращены провайдером"}
                                    </p>
                                )}
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
