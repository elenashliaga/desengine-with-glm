"use client";

import { useMemo, useState } from "react";
import { type LabWorkbenchProps } from "./props";

import { InOut } from "../InOut";
import { Prompt } from "../Propmt";
import { CodeList } from "../Code";
import { BaseStyles } from "../Base";
import { Button } from "@/components/ui/button";
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
}: LabWorkbenchProps) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState<string>("");
    const [startStatus, setStartStatus] = useState<"" | "starting" | "error">("");
    const [startError, setStartError] = useState<string>("");
    const [completePending, setCompletePending] = useState(false);
    const [completeError, setCompleteError] = useState("");
    const [previewVersion, setPreviewVersion] = useState(0);

    const editableFileIds = useMemo(() => {
        return new Set(
            taskWorkbenchFiles
                .filter((f) => f.edit === true)
                .map((f) => f.id)
        );
    }, []);

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
            const debug = data?.debug ? `\n\nDEBUG:\n${JSON.stringify(data.debug, null, 2)}` : "";
            setStartError((data?.error || "Ошибка старта задачи") + debug);
            setStartStatus("error");
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
                    <Button
                        variant="secondary"
                        disabled={completePending || taskItem.progress.currentLevelStatus === "completed"}
                        onClick={handleComplete}
                    >
                        {completePending ? "Завершение…" : "Я закончил"}
                    </Button>
                </div>
            </div>

            <InOut
              task={taskItem.id}
              started={started}
              reloadKey={previewVersion}
              onStart={handleStart}
              startStatus={startStatus}
              startError={startError}
            />

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

                    <CodeList taskData={taskData} onTaskDataChange={onTaskDataChange} />
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
        </div>
    );
}


export { LabWorkbench }
