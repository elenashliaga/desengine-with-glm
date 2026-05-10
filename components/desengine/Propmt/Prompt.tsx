import { BaseProps } from "../Base";
import type { TaskData, TaskListItem } from "@/lib/types";

type PromptProps = BaseProps & {
    taskItem: TaskListItem;
    taskData: TaskData;
    status?: string;
    error?: string;
}

function Prompt({
    taskItem,
    taskData,
    status = "",
    error = "",
}: PromptProps) {
    return (
        <div className="space-y-3">
            {status && <p className="text-muted-foreground">{status}</p>}
            {error && <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive whitespace-pre-wrap">{error}</pre>}
            <p className="text-muted-foreground">
                Осталось промптов на этом уровне: {Math.max(taskItem.progress.promptsLimit - taskItem.progress.promptsUsed, 0)}
            </p>
            {!taskItem.progress.currentLevelStarted && (
                <p className="text-muted-foreground">
                    Уточняющие промпты станут доступны после явного старта текущего уровня.
                </p>
            )}

            <div className="rounded-md border p-3">
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
                <p className="font-medium">История уточнений</p>
                {taskData.promptHistory.length === 0 ? (
                    <p className="text-muted-foreground">Пока пусто</p>
                ) : (
                    <div className="space-y-2">
                        {taskData.promptHistory.map((entry) => (
                            <div key={`${entry.createdAt}-${entry.text}`} className="rounded-md border p-3">
                                <p className="text-muted-foreground">{entry.createdAt}</p>
                                <p className="text-muted-foreground">
                                  Уровень: {entry.levelNumber ?? "не указан"}
                                </p>
                                <p className="whitespace-pre-wrap">{entry.text}</p>
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
