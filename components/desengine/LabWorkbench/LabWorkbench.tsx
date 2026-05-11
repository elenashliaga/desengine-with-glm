"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { type LabWorkbenchProps } from "./props";

import { MarkdownContent } from "../MarkdownContent";
import { InOut } from "../InOut";
import { Prompt, PromptComposer } from "../Propmt";
import { SnapshotPublishPanel } from "../SnapshotPublishPanel";
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

const AUTOSAVE_DELAY_MS = 10_000;

function LabWorkbench({
    taskItem,
    taskData,
    onTaskItemChange,
    onTaskDataChange,
    onBackToLevelList,
    onCheckResult,
    onTransition,
    activeScreen,
    onScreenChange,
}: LabWorkbenchProps) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
    const [saveError, setSaveError] = useState<string>("");
    const [completePending, setCompletePending] = useState(false);
    const [completeError, setCompleteError] = useState("");
    const [resetPending, setResetPending] = useState(false);
    const [resetError, setResetError] = useState("");
    const [promptText, setPromptText] = useState("");
    const [promptStatus, setPromptStatus] = useState("");
    const [promptError, setPromptError] = useState("");
    const [promptPending, setPromptPending] = useState(false);
    const [snapshotPending, setSnapshotPending] = useState(false);
    const [snapshotStatus, setSnapshotStatus] = useState("");
    const [snapshotError, setSnapshotError] = useState("");
    const [snapshotUrl, setSnapshotUrl] = useState("");
    const [previewVersion, setPreviewVersion] = useState(0);
    const [dirtyFileIds, setDirtyFileIds] = useState<string[]>([]);
    const [autosaveRevision, setAutosaveRevision] = useState(0);

    const savedContentByFileIdRef = useRef<Record<string, string>>({
        ...taskData.contentByFileId,
    });
    const currentContentByFileIdRef = useRef<Record<string, string>>(taskData.contentByFileId);
    const dirtyFileIdsRef = useRef<string[]>([]);
    const editableFileIdsRef = useRef<Set<string>>(new Set());
    const taskIdRef = useRef(taskItem.id);
    const savePromiseRef = useRef<Promise<boolean> | null>(null);

    const editableFileIds = useMemo(() => {
        const editableIds = taskData.labContext?.editableFileIds ?? [];
        return new Set(
            taskWorkbenchFiles
                .filter((f) => f.edit === true && editableIds.includes(f.id))
                .map((f) => f.id)
        );
    }, [taskData.labContext?.editableFileIds]);

    useEffect(() => {
        currentContentByFileIdRef.current = taskData.contentByFileId;
    }, [taskData.contentByFileId]);

    useEffect(() => {
        dirtyFileIdsRef.current = dirtyFileIds;
    }, [dirtyFileIds]);

    useEffect(() => {
        editableFileIdsRef.current = editableFileIds;
    }, [editableFileIds]);

    useEffect(() => {
        taskIdRef.current = taskItem.id;
    }, [taskItem.id]);

    function replaceTaskData(nextTaskData: typeof taskData) {
        savedContentByFileIdRef.current = {
            ...nextTaskData.contentByFileId,
        };
        currentContentByFileIdRef.current = nextTaskData.contentByFileId;
        dirtyFileIdsRef.current = [];
        setDirtyFileIds([]);
        setSaveError("");
        setSaveStatus("idle");
        onTaskDataChange(nextTaskData);
    }

    function markFileDirtyState(fileId: string, nextValue: string) {
        const savedValue = savedContentByFileIdRef.current[fileId] ?? "";

        setDirtyFileIds((current) => {
            const isDirty = current.includes(fileId);
            const shouldBeDirty = nextValue !== savedValue;

            if (shouldBeDirty === isDirty) {
                return current;
            }

            if (shouldBeDirty) {
                const next = [...current, fileId];
                dirtyFileIdsRef.current = next;
                return next;
            }

            const next = current.filter((currentFileId) => currentFileId !== fileId);
            dirtyFileIdsRef.current = next;
            return next;
        });
    }

    async function saveDirtyFiles(targetFileIds?: string[]) {
        while (true) {
            if (savePromiseRef.current) {
                const existingSaveSucceeded = await savePromiseRef.current;
                if (!existingSaveSucceeded) {
                    return false;
                }
                continue;
            }

            const dirtySet = new Set(dirtyFileIdsRef.current);
            const allowedTargetIds = targetFileIds ? new Set(targetFileIds) : null;
            const updates = Object.entries(currentContentByFileIdRef.current)
                .filter(([fileId]) => editableFileIdsRef.current.has(fileId))
                .filter(([fileId]) => dirtySet.has(fileId))
                .filter(([fileId]) => (allowedTargetIds ? allowedTargetIds.has(fileId) : true))
                .map(([fileId, content]) => ({ fileId, content }));

            if (updates.length === 0) {
                return true;
            }

            const promise = (async () => {
                setSaveStatus("saving");
                setSaveError("");

                const res = await fetch(`/api/tasks/${taskIdRef.current}/files`, {
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
                    return false;
                }

                for (const update of updates) {
                    savedContentByFileIdRef.current[update.fileId] = update.content;
                }

                setDirtyFileIds((current) => {
                    const next = current.filter((fileId) => {
                        const savedValue = savedContentByFileIdRef.current[fileId] ?? "";
                        const currentValue = currentContentByFileIdRef.current[fileId] ?? "";
                        return currentValue !== savedValue;
                    });

                    dirtyFileIdsRef.current = next;
                    return next;
                });
                setSaveStatus("idle");
                setPreviewVersion((current) => current + 1);
                return true;
            })();

            savePromiseRef.current = promise;

            try {
                const saved = await promise;
                if (!saved) {
                    return false;
                }
            } finally {
                savePromiseRef.current = null;
            }
        }
    }

    useEffect(() => {
        if (dirtyFileIds.length === 0) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void saveDirtyFiles();
        }, AUTOSAVE_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [autosaveRevision, dirtyFileIds.length]);

    useEffect(() => {
        function handleWindowKeyDown(event: globalThis.KeyboardEvent) {
            const isSaveHotkey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";

            if (!isSaveHotkey) {
                return;
            }

            event.preventDefault();
            void saveDirtyFiles();
        }

        window.addEventListener("keydown", handleWindowKeyDown);

        return () => {
            window.removeEventListener("keydown", handleWindowKeyDown);
        };
    }, []);

    async function handleSave() {
        await saveDirtyFiles();
    }

    async function saveBeforeAction(targetFileIds?: string[]) {
        const saved = await saveDirtyFiles(targetFileIds);

        if (!saved) {
            return false;
        }

        return true;
    }

    async function handleBackToLevelList() {
        const saved = await saveBeforeAction();
        if (!saved) {
            return;
        }

        onBackToLevelList();
    }

    async function handleFileChange(nextFileId: string) {
        const saved = await saveBeforeAction(activeScreen ? [activeScreen] : undefined);
        if (!saved) {
            return;
        }

        onScreenChange(nextFileId);
    }

    async function handleCheck() {
        const saved = await saveBeforeAction();
        if (!saved) {
            return;
        }

        setCompletePending(true);
        setCompleteError("");

        const res = await fetch(`/api/tasks/${taskItem.id}/check`, { method: "POST" });
        const data = await res.json().catch(() => null);

        setCompletePending(false);

        if (!res.ok || !data?.ok || !data?.checkResult || !data?.taskData) {
            setCompleteError(data?.error || "Не удалось проверить уровень");
            return;
        }

        replaceTaskData(data.taskData);
        onCheckResult(
            data.checkResult,
            data.transition ?? null,
            data.taskItem ?? null,
            data.taskData,
        );
    }

    async function handleReset() {
        const saved = await saveBeforeAction();
        if (!saved) {
            return;
        }

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
                replaceTaskData(data.taskData);
            }
            onTransition(null);
            onScreenChange("component");
            setResetPending(false);
        } catch {
            setResetPending(false);
            setResetError("Не удалось сбросить задачу");
        }
    }

    async function handlePromptRun() {
        const saved = await saveBeforeAction();
        if (!saved) {
            return;
        }

        setPromptStatus("");
        setPromptError("");

        if (!taskItem.progress.currentLevelStarted) {
            setPromptError("Сначала начните текущий уровень");
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
        replaceTaskData(data.taskData);
        onTransition(data.transition ?? null);
        setPreviewVersion((current) => current + 1);
        setPromptText("");
        setPromptStatus("Уточнение применено");
    }

    async function handleSnapshotPublish() {
        const saved = await saveBeforeAction();
        if (!saved) {
            return;
        }

        setSnapshotPending(true);
        setSnapshotStatus("");
        setSnapshotError("");

        const res = await fetch(`/api/tasks/${taskItem.id}/snapshot`, {
            method: "POST",
        });
        const data = await res.json().catch(() => null);

        setSnapshotPending(false);

        if (!res.ok || !data?.ok || !data?.snapshotUrl) {
            setSnapshotError(data?.error || "Не удалось опубликовать слепок");
            return;
        }

        setSnapshotUrl(data.snapshotUrl);
        setSnapshotStatus("Публичная ссылка готова.");
    }

    function handlePromptKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
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

    function handleCodeChange(fileId: string, nextValue: string) {
        const nextTaskData = {
            ...taskData,
            contentByFileId: {
                ...taskData.contentByFileId,
                [fileId]: nextValue,
            },
        };

        currentContentByFileIdRef.current = nextTaskData.contentByFileId;
        markFileDirtyState(fileId, nextValue);
        setAutosaveRevision((current) => current + 1);
        onTaskDataChange(nextTaskData);
    }

    const canCompleteCurrentLevel = taskItem.progress.currentLevelStarted && taskItem.progress.currentLevelStatus !== "completed";
    const levelReadyForWork = taskItem.progress.currentLevelStarted;
    const promptInputDisabled = promptPending;
    const promptRunDisabled = promptPending;
    const hasDirtyFiles = dirtyFileIds.length > 0;

    return (
        <div
            className="grid overflow-hidden rounded-xl bg-white shadow-2xl"
            style={{
                height: "calc(100dvh - 20px)",
                gridTemplateRows: "minmax(0, 1fr) auto",
            }}
        >
            <div className="min-h-0 overflow-y-auto px-3 pb-5 pt-3 md:px-4 md:pb-6 md:pt-4">
                <div className="space-y-3 md:space-y-4">
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
                            <Button variant="outline" onClick={() => void handleBackToLevelList()}>
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
                      started={taskItem.started}
                      reloadKey={previewVersion}
                      startStatus=""
                    />

                    {taskData.labContext && (
                        <div className="rounded-md border p-4">
                            <p className="font-medium">Что важно в этой задаче</p>
                            <MarkdownContent
                                className="mt-2"
                                content={taskData.labContext.taskTip || "Для этого уровня пока нет отдельного пояснения задачи."}
                            />
                        </div>
                    )}

                    {levelReadyForWork && (
                        <div className="space-y-3 pb-4">
                            <SnapshotPublishPanel
                              pending={snapshotPending}
                              status={snapshotStatus}
                              error={snapshotError}
                              snapshotUrl={snapshotUrl}
                              onPublish={() => void handleSnapshotPublish()}
                            />

                            {hasDirtyFiles && (
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => void handleSave()} variant="secondary" disabled={saveStatus === "saving"}>
                                        {saveStatus === "saving" ? "Сохранение…" : "Сохранить"}
                                    </Button>
                                </div>
                            )}

                            {saveStatus === "error" && (
                                <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive whitespace-pre-wrap">
                                    {saveError}
                                </pre>
                            )}

                            <CodeList
                              taskData={taskData}
                              onFileChange={handleCodeChange}
                              activeFileId={activeScreen}
                              onActiveFileIdChange={(nextFileId) => void handleFileChange(nextFileId)}
                              dirtyFileIds={dirtyFileIds}
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

            {levelReadyForWork && (
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
