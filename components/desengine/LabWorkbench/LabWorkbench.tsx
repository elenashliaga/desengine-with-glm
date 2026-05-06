"use client";

import { useMemo, useState } from "react";
import { type LabWorkbenchProps } from "./props";

import { InOut } from "../InOut";
import { Prompt } from "../Propmt";
import { CodeList } from "../Code";
import { BaseStyles } from "../Base";
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

    async function handleComplete() {
        setCompletePending(true);
        setCompleteError("");

        const res = await fetch(`/api/tasks/${taskItem.id}/complete`, { method: "POST" });
        const data = await res.json().catch(() => null);

        setCompletePending(false);

        if (!res.ok || !data?.ok) {
            setCompleteError(data?.error || "Не удалось завершить уровень");
            return;
        }

        onTaskItemChange(data.taskItem ?? null);
        onTaskDataChange(data.taskData);
        onTransition(data.transition ?? null);
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

    return (
        <div className={BaseStyles.frameCol}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p>Рабочий стол</p>
                    <p className="text-sm text-muted-foreground">
                        Задача: <code>{taskItem.id}</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Уровень {taskItem.progress.currentLevel} из {taskItem.maxLevel}. Промптов: {taskItem.progress.promptsUsed} / {taskItem.progress.promptsLimit}.
                    </p>
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
                        disabled={completePending || resetPending || taskItem.progress.currentLevelStatus === "completed"}
                        onClick={handleComplete}
                    >
                        {completePending ? "Завершение…" : "Я закончил"}
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
                <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
                    {startError}
                </pre>
            )}

            {taskData.labContext && (
                <div className="rounded-md border p-4 text-sm">
                    <p className="font-medium">Пояснение уровня</p>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        {taskData.labContext.commonExplanation}
                    </p>
                    <p className="mt-4 font-medium">Пояснение задачи</p>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        {taskData.labContext.taskExplanation}
                    </p>
                </div>
            )}

            {started && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} variant="secondary" disabled={saveStatus === "saving"}>
                            {saveStatus === "saving" ? "Сохранение…" : "Сохранить"}
                        </Button>
                        {saveStatus === "saved" && (
                            <span className="text-sm text-muted-foreground">Сохранено</span>
                        )}
                    </div>

                    {saveStatus === "error" && (
                        <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
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
                      key={taskItem.id}
                      taskId={taskItem.id}
                      taskItem={taskItem}
                      taskData={taskData}
                      started={started}
                      onTaskItemChange={onTaskItemChange}
                      onTaskDataChange={onTaskDataChange}
                      onTransition={onTransition}
                      onIterationApplied={() => setPreviewVersion((current) => current + 1)}
                    />
                </div>
            )}

            {completeError && (
                <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
                    {completeError}
                </pre>
            )}

            {resetError && (
                <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
                    {resetError}
                </pre>
            )}
        </div>
    );
}


export { LabWorkbench }
