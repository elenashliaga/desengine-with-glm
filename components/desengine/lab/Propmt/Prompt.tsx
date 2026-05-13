"use client";

import { useState } from "react";

import { BaseProps } from "../Base";
import { Button } from "@/components/ui/button";
import { formatPromptHistoryTimestamp } from "@/lib/task/prompt-history";
import type { TaskData, TaskListItem } from "@/lib/platform/types";
import { taskWorkbenchFiles } from "@/lib/platform/client";

type PromptProps = BaseProps & {
    taskItem: TaskListItem;
    taskData: TaskData;
    status?: string;
    error?: string;
}

const workbenchFileNameById = new Map(taskWorkbenchFiles.map((file) => [file.id, file.fileName]));

function resolveChangedFileNames(entry: TaskData["promptHistory"][number]) {
    if (entry.changedFileNames?.length) {
        return entry.changedFileNames;
    }

    if (entry.changedFileIds?.length) {
        return entry.changedFileIds.map((fileId) => workbenchFileNameById.get(fileId) ?? fileId);
    }

    return [];
}

function Prompt({
    taskItem,
    taskData,
    status = "",
    error = "",
}: PromptProps) {
    const [copiedEntryKey, setCopiedEntryKey] = useState<string | null>(null);

    async function handleCopy(text: string, key: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedEntryKey(key);
            window.setTimeout(() => {
                setCopiedEntryKey((current) => (current === key ? null : current));
            }, 1500);
        } catch {
            setCopiedEntryKey(null);
        }
    }

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
                        {taskData.promptHistory.map((entry, index) => {
                            const entryKey = `${entry.createdAt}-${entry.text}`;
                            const changedFileNames = resolveChangedFileNames(entry);

                            return (
                                <div key={entryKey} className="grid gap-3 py-2 grid-cols-[minmax(0,1fr)_20rem]">
                                    <p className="whitespace-pre-wrap">{entry.text}</p>

                                    <div className="space-y-1">
                                        <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => void handleCopy(entry.text, entryKey)}
                                            >
                                              {copiedEntryKey === entryKey ? "Скопировано" : "Скопировать"}
                                            </Button>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Запрос #{entry.iterationNumber ?? index + 1}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {entry.displayCreatedAt ?? formatPromptHistoryTimestamp(entry.createdAt)}
                                        </p>
                                        <p className="text-muted-foreground">
                                          Уровень: {entry.levelNumber ?? "не указан"}
                                        </p>
                                        <p className="text-muted-foreground">
                                          Изменены: {changedFileNames.length ? changedFileNames.join(", ") : "нет изменений"}
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
                                </div>
                            );
                        })}
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
