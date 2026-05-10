"use client";

import { type KeyboardEvent, useMemo, useState } from "react";
import { type LabWorkbenchProps } from "./props";

import { InOut } from "../InOut";
import { Prompt, PromptComposer } from "../Propmt";
import { CodeList } from "../Code";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { taskWorkbenchFiles } from "@/lib/client";

type SaveErrorItem = {
    fileId: string;
    error: string;
}

function LabWorkbench({
    taskItem,
    taskData,
    onTaskItemChange,
    onTaskDataChange,
    started,
    onStartedChange,
    onBackToLevelList,
    onCheckResult,
    onTransition,
    activeScreen,
    onScreenChange,
}: LabWorkbenchProps) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState<string>("");
    const [startStatus, setStartStatus] = useState<"" | "starting">("");
    const [startError, setStartError] = useState("");
    const [completePending, setCompletePending] = useState(false);
    const [completeError, setCompleteError] = useState("");
    const [resetPending, setResetPending] = useState(false);
    const [resetError, setResetError] = useState("");
    const [promptText, setPromptText] = useState("");
    const [promptStatus, setPromptStatus] = useState("");
    const [promptError, setPromptError] = useState("");
    const [promptPending, setPromptPending] = useState(false);
    const [previewVersion, setPreviewVersion] = useState(0);

    const editableFileIds = useMemo(() => {
        const editableIds = taskData.labContext?.editableFileIds ?? [];
        return new Set(
            taskWorkbenchFiles
                .filter((f) => f.edit === true && editableIds.includes(f.id))
                .map((f) => f.id)
        );
    }, [taskData.labContext?.editableFileIds]);

    async function handleSave() {
        setSaveStatus("saving");
        setSaveError("");

        const updates = Object.entries(taskData.contentByFileId)
            .filter(([fileId]) => editableFileIds.has(fileId))
            .map(([fileId, content]) => ({ fileId, content }));

        const res = await fetch(`/api/tasks/${taskItem.id}/files`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                updates,
            }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
            const err =
                data?.error ||
                (Array.isArray(data?.errors) ? data.errors.map((e: SaveErrorItem) => `${e.fileId}: ${e.error}`).join("\n") : "") ||
                "Ошибка сохранения";

            setSaveError(err);
            setSaveStatus("error");
            return;
        }

        setSaveStatus("saved");
        setPreviewVersion((current) => current + 1);
    }

    async function handleStart() {
        setStartStatus("starting");
        setStartError("");

        const res = await fetch(`/api/tasks/${taskItem.id}/start`, { method: "POST" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
            setStartError(data?.error || "Не удалось запустить задачу");
            setStartStatus("");
            return;
        }

        onTaskItemChange(data.taskItem ?? null);
        onTaskDataChange(data.taskData);
        onStartedChange(true);
        setStartStatus("");
        setPreviewVersion((current) => current + 1);
    }

    async function handleCheck() {
        setCompletePending(true);
        setCompleteError("");

        const res = await fetch(`/api/tasks/${taskItem.id}/check`, { method: "POST" });
        const data = await res.json().catch(() => null);

        setCompletePending(false);

        if (!res.ok || !data?.ok || !data?.checkResult || !data?.taskData) {
            setCompleteError(data?.error || "Не удалось проверить уровень");
            return;
        }

        onCheckResult(
            data.checkResult,
            data.transition ?? null,
            data.taskItem ?? null,
            data.taskData,
            Boolean(data.started),
        );
    }

    async function handleReset() {
        setResetPending(true);
        setResetError("");

        try {
            const res = await fetch(`/api/tasks/${taskItem.id}/reset`, { method: "POST" });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.ok) {
                setResetPending(false);
                setResetError(data?.error || "Не удалось сбросить задачу");
                return;
            }

            if (data.taskItem) {
                onTaskItemChange(data.taskItem);
            }
            if (data.taskData) {
                onTaskDataChange(data.taskData);
            }
            onStartedChange(false);
            onTransition(null);
            onScreenChange("component");
            setResetPending(false);
        } catch {
            setResetPending(false);
            setResetError("Не удалось сбросить задачу");
        }
    }

    async function handlePromptRun() {
        setPromptStatus("");
        setPromptError("");

        if (!started) {
            setPromptError("Сначала запустите задачу");
            return;
        }

        if (!taskItem.progress.currentLevelInitialized) {
            setPromptError("Сначала дождитесь инициирующего запуска текущего уровня");
            return;
        }

        if (!promptText.trim()) {
            setPromptError("Введите уточняющий промпт");
            return;
        }

        setPromptPending(true);

        const res = await fetch(`/api/tasks/${taskItem.id}/iterate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                prompt: promptText,
            }),
        });

        const data = await res.json().catch(() => null);
        setPromptPending(false);

        if (!res.ok || !data?.ok) {
            setPromptError(data?.error || "Ошибка запуска итерации");
            return;
        }

        onTaskItemChange(data.taskItem ?? null);
        onTaskDataChange(data.taskData);
        onTransition(data.transition ?? null);
        setPreviewVersion((current) => current + 1);
        setPromptText("");
        setPromptStatus("Уточнение применено");
    }

    function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
        }

        event.preventDefault();

        if (promptPending) {
            return;
        }

        void handlePromptRun();
    }

    function handlePromptChange(nextValue: string) {
        setPromptText(nextValue);

        if (promptStatus) {
            setPromptStatus("");
        }

        if (promptError) {
            setPromptError("");
        }
    }

    const canCompleteCurrentLevel = started && taskItem.progress.currentLevelInitialized && taskItem.progress.currentLevelStatus !== "completed";
    const promptInputDisabled = promptPending;
    const promptRunDisabled = promptPending;

    return (
        <div
            className="grid overflow-hidden rounded-xl bg-white shadow-2xl"
            style={{
                height: "calc(100dvh - 20px)",
                gridTemplateRows: "minmax(0, 1fr) auto",
            }}
        >
            <div className="min-h-0 overflow-y-auto p-4 pb-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p>Рабочий стол</p>
                            <p className="text-muted-foreground">
                                Задача: <code>{taskItem.id}</code>
                            </p>
                            <p className="text-muted-foreground">
                                Уровень {taskItem.progress.currentLevel} из {taskItem.maxLevel}. Промптов: {taskItem.progress.promptsUsed} / {taskItem.progress.promptsLimit}.
                            </p>
                            {taskItem.progress.currentLevelDisplayStatus === "awaiting_check_retry" && (
                                <p className="text-muted-foreground">
                                    Статус уровня: ждёт повторной проверки.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={onBackToLevelList}>
                                К списку задач уровня
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={completePending || resetPending}
                                    >
                                        {resetPending ? "Сброс…" : "Сбросить задачу"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent size="sm">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Сбросить задачу?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Будут удалены рабочие файлы и история уточнений. Задача снова станет не начатой.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction
                                            variant="destructive"
                                            onClick={() => void handleReset()}
                                        >
                                            Подтвердить сброс
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button
                                variant="secondary"
                                disabled={completePending || resetPending || !canCompleteCurrentLevel}
                                onClick={handleCheck}
                            >
                                {completePending ? "Проверка…" : "Я закончил"}
                            </Button>
                        </div>
                    </div>

                    <InOut
                      task={taskItem.id}
                      taskData={taskData}
                      started={started}
                      reloadKey={previewVersion}
                      onStart={handleStart}
                      startStatus={startStatus}
                    />

                    {startError && (
                        <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive whitespace-pre-wrap">
                            {startError}
                        </pre>
                    )}

                    {taskData.labContext && (
                        <div className="rounded-md border p-4">
                            <p className="font-medium">Пояснение уровня</p>
                            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                                {taskData.labContext.commonExplanation}
                            </p>
                            <p className="mt-4 font-medium">Пояснение задачи</p>
                            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                                {taskData.labContext.taskTip}
                            </p>
                        </div>
                    )}

                    {started && (
                        <div className="space-y-3 pb-4">
                            <div className="flex items-center gap-2">
                                <Button onClick={handleSave} variant="secondary" disabled={saveStatus === "saving"}>
                                    {saveStatus === "saving" ? "Сохранение…" : "Сохранить"}
                                </Button>
                                {saveStatus === "saved" && (
                                    <span className="text-muted-foreground">Сохранено</span>
                                )}
                            </div>

                            {saveStatus === "error" && (
                                <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive whitespace-pre-wrap">
                                    {saveError}
                                </pre>
                            )}

                            <CodeList
                              taskData={taskData}
                              onTaskDataChange={onTaskDataChange}
                              activeFileId={activeScreen}
                              onActiveFileIdChange={onScreenChange}
                            />
                            <Prompt
                              taskItem={taskItem}
                              taskData={taskData}
                              status={promptStatus}
                              error={promptError}
                            />
                        </div>
                    )}

                    {completeError && (
                        <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive whitespace-pre-wrap">
                            {completeError}
                        </pre>
                    )}

                    {resetError && (
                        <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive whitespace-pre-wrap">
                            {resetError}
                        </pre>
                    )}
                </div>
            </div>

            {started && (
                <PromptComposer
                  value={promptText}
                  disabled={promptInputDisabled}
                  pending={promptPending}
                  runDisabled={promptRunDisabled}
                  onChange={handlePromptChange}
                  onKeyDown={handlePromptKeyDown}
                  onRun={() => void handlePromptRun()}
                />
            )}
        </div>
    );
}


export { LabWorkbench }
