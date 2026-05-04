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

function LabWorkbench({taskItem, taskData, onTaskDataChange, started, onStartedChange}: LabWorkbenchProps) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState<string>("");
    const [startStatus, setStartStatus] = useState<"" | "starting" | "error">("");
    const [startError, setStartError] = useState<string>("");
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

        onTaskDataChange(data.taskData);
        onStartedChange(true);
        setStartStatus("");
        setPreviewVersion((current) => current + 1);
    }

    return (
        <div className={BaseStyles.frameCol}>
            <p>Рабочий стол</p>
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
                      taskData={taskData}
                      started={started}
                      onTaskDataChange={onTaskDataChange}
                      onIterationApplied={() => setPreviewVersion((current) => current + 1)}
                    />
                </div>
            )}
        </div>
    );
}


export { LabWorkbench }
