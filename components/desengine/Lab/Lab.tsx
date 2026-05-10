"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LabWorkbench } from "../LabWorkbench";
import { LevelOverview } from "../LevelOverview";
import { TaskCheckResult } from "../TaskCheckResult";
import { TaskDone } from "../TaskDone";
import { TaskLevelTransition } from "../TaskLevelTransition";
import { LabProps } from "./props"
import type { LabScreenState, LevelOverview as LevelOverviewData, TaskCheckResult as TaskCheckResultData, TaskData, TaskListItem, TaskTransition } from "@/lib/types";
import { createLevelsPath, createTaskCheckPath, createTaskDonePath, createTaskNextPath, createTaskPath } from "@/lib/navigation";

function createLevelHref(levelId?: string | null) {
    return createLevelsPath(levelId);
}

function createTaskHref(taskId: string, screen?: string | null) {
    return createTaskPath(taskId, screen);
}

function createTransitionHref(transition: TaskTransition) {
    return createTaskNextPath(transition.taskId);
}

function createDoneHref(taskId: string) {
    return createTaskDonePath(taskId);
}

function createCheckHref(taskId: string) {
    return createTaskCheckPath(taskId);
}

function Lab({initLevelOverview, initScreen, initTaskItem, initTaskData} : LabProps) {
    const router = useRouter();
    const [screen, setScreen] = useState<LabScreenState>(initScreen);
    const [levelOverview, setLevelOverview] = useState<LevelOverviewData>(initLevelOverview);
    const [taskItem, setTaskItem] = useState(initTaskItem);
    const [taskData, setTaskData] = useState(initTaskData);
    const [status, setStatus] = useState<string>("");
    const [started, setStarted] = useState<boolean>(Boolean(initTaskItem?.started));

    async function loadLevelOverview(levelId?: string, options?: { silent?: boolean }) {
        const ref = levelId ? `/api/levels/${levelId}` : "/api/levels/current";
        if (!options?.silent) {
            setStatus("Загрузка уровня…");
        }
        const res = await fetch(ref, { method: "GET" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
            setStatus(data?.error || "Ошибка загрузки уровня");
            return null;
        }

        setLevelOverview(data.overview);
        setStatus("");
        return data.overview as LevelOverviewData;
    }

    async function handleTaskOpen(taskId: string) {
        setStatus("Загрузка задания…");
        router.push(createTaskHref(taskId));

        const res = await fetch(`/api/tasks/${taskId}`, { method: "GET" });
        const data = await res.json();

        if (!data?.ok) {
            setStatus(data?.error || "Ошибка загрузки задания");
            return;
        }

        setTaskItem(data.taskItem);
        setTaskData(data.taskData);
        setStarted(Boolean(data.started));
        setScreen({ type: "task", screen: "component" });
        setStatus("");
    }

    async function handleNavigateLevel(levelId: string) {
        router.push(createLevelHref(levelId));
        setScreen({ type: "level" });
        setStatus("");
        void loadLevelOverview(levelId, { silent: true });
    }

    async function handleReturnToLevelList(levelId?: string) {
        router.push(createLevelHref(levelId));
        setScreen({ type: "level" });
        setStatus("");
        void loadLevelOverview(levelId, { silent: true });
    }

    function handleTaskItemChange(next: TaskListItem | null) {
        if (!next) return;
        setTaskItem(next);
    }

    function handleTransition(transition: TaskTransition | null) {
        if (!transition) return;
        router.push(createTransitionHref(transition));
        setScreen({ type: "transition", transition });
    }

    function handleCheckResult(
        result: TaskCheckResultData,
        transition: TaskTransition | null,
        nextTaskItem: TaskListItem | null,
        nextTaskData: TaskData,
        nextStarted: boolean,
    ) {
        if (nextTaskItem) {
            setTaskItem(nextTaskItem);
        }
        setTaskData(nextTaskData);
        setStarted(nextStarted);
        router.push(createCheckHref(result.taskId));
        setScreen({ type: "check", result, transition });
    }

    function handleScreenChange(nextScreen: string) {
        if (!taskItem) return;
        router.push(createTaskHref(taskItem.id, nextScreen));
        setScreen({ type: "task", screen: nextScreen });
    }

    return (
        <main>
            {status && (
                <p className="text-muted-foreground">{status}</p>
            )}

            {screen.type === "level" ? (
                <LevelOverview
                    overview={levelOverview}
                    pending={status.length > 0}
                    onOpenTask={handleTaskOpen}
                    onNavigateLevel={handleNavigateLevel}
                />
            ) : null}

            {screen.type === "transition" ? (
                <TaskLevelTransition
                    transition={screen.transition}
                    started={started}
                    pending={status.length > 0}
                    onContinue={() => {
                        router.push(createTaskHref(screen.transition.taskId));
                        setScreen({ type: "task", screen: "component" });
                    }}
                    onBackToLevelList={() => handleReturnToLevelList(screen.transition.toLevel?.id)}
                />
            ) : null}

            {screen.type === "done" ? (
                <TaskDone
                    transition={screen.transition}
                    started={started}
                    pending={status.length > 0}
                    onOpenTask={() => {
                        router.push(createTaskHref(screen.transition.taskId));
                        setScreen({ type: "task", screen: "component" });
                    }}
                    onBackToTaskList={() => handleReturnToLevelList()}
                />
            ) : null}

            {screen.type === "check" ? (
                <TaskCheckResult
                    result={screen.result}
                    transition={screen.transition}
                    pending={status.length > 0}
                    onContinue={() => {
                        if (screen.transition?.toLevel) {
                            router.push(createTransitionHref(screen.transition));
                            setScreen({ type: "transition", transition: screen.transition });
                            return;
                        }

                        if (screen.transition) {
                            router.push(createDoneHref(screen.transition.taskId));
                            setScreen({ type: "done", transition: screen.transition });
                            return;
                        }

                        handleReturnToLevelList(taskItem?.progress.currentLevelId);
                    }}
                    onBackToLab={() => {
                        if (!taskItem) return;
                        router.push(createTaskHref(taskItem.id));
                        setScreen({ type: "task", screen: "component" });
                    }}
                    onRetry={async () => {
                        if (!taskItem) return;

                        setStatus("Повторная проверка уровня…");
                        const res = await fetch(`/api/tasks/${taskItem.id}/check`, { method: "POST" });
                        const data = await res.json().catch(() => null);

                        if (!res.ok || !data?.ok || !data?.checkResult || !data?.taskData) {
                            setStatus(data?.error || "Не удалось повторить проверку");
                            return;
                        }

                        setStatus("");
                        handleCheckResult(
                            data.checkResult,
                            data.transition ?? null,
                            data.taskItem ?? null,
                            data.taskData,
                            Boolean(data.started),
                        );
                    }}
                />
            ) : null}

            {screen.type === "task" && taskItem && taskData ? (
                <LabWorkbench
                    taskItem={taskItem}
                    taskData={taskData}
                    onTaskItemChange={handleTaskItemChange}
                    onTaskDataChange={setTaskData}
                    started={started}
                    onStartedChange={setStarted}
                    onBackToLevelList={() => handleReturnToLevelList(taskItem.progress.currentLevelId)}
                    onCheckResult={handleCheckResult}
                    onTransition={handleTransition}
                    activeScreen={screen.screen}
                    onScreenChange={handleScreenChange}
                />
            ) : null}
        </main>
    );
}
export { Lab }
