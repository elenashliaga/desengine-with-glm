"use client";

/** Типы доменной области */
import type { LevelOverview as LevelOverviewData } from "@/lib/level/types"
import type { TaskCheckResult as TaskCheckResultData, TaskData, TaskListItem, TaskTransition } from "@/lib/task/types";

/** Функции */
import { createLevelsPath, createTaskCheckPath, createTaskDonePath, createTaskPath } from "@/lib/platform/navigation";

/** Пропсы */
import { LabProps } from "./props"

/** Состояния */
import { LabScreenState } from "./states"

/** Хэндлеры */
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Компоненты */
import { Workbench } from "../Workbench";
import { LevelOverview } from "../../level/LevelOverview";
import { TaskCheckResult } from "../../task/TaskCheckResult";
import { TaskDone } from "../../task/TaskDone";
import { TaskLevelStart } from "../../task/TaskLevelStart";
import { TaskLevelTransition } from "../../task/TaskLevelTransition";




function createLevelHref(levelId?: string | null) {
    return createLevelsPath(levelId);
}

function createTaskHref(taskId: string, screen?: string | null) {
    return createTaskPath(taskId, screen);
}

function createDoneHref(taskId: string) {
    return createTaskDonePath(taskId);
}

function createCheckHref(taskId: string) {
    return createTaskCheckPath(taskId);
}

function replaceTaskUrl(taskId: string, screen?: string | null) {
    if (typeof window === "undefined") {
        return;
    }

    const nextHref = createTaskHref(taskId, screen);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentHref === nextHref) {
        return;
    }

    window.history.replaceState(window.history.state, "", nextHref);
}

function Lab({initLevelOverview, initScreen, initTaskItem, initTaskData} : LabProps) {
    const router = useRouter();
    const [screen, setScreen] = useState<LabScreenState>(initScreen);
    const [levelOverview, setLevelOverview] = useState<LevelOverviewData>(initLevelOverview);
    const [taskItem, setTaskItem] = useState(initTaskItem);
    const [taskData, setTaskData] = useState(initTaskData);
    const [status, setStatus] = useState<string>("");
    const [startStatus, setStartStatus] = useState<"" | "starting">("");
    const [startError, setStartError] = useState("");

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

        if (transition.toLevel) {
            router.push(createTaskHref(transition.taskId));
            setScreen({ type: "task", screen: "component" });
            return;
        }

        router.push(createDoneHref(transition.taskId));
        setScreen({ type: "done", transition });
    }

    function handleCheckResult(
        result: TaskCheckResultData,
        transition: TaskTransition | null,
        nextTaskItem: TaskListItem | null,
        nextTaskData: TaskData,
    ) {
        if (nextTaskItem) {
            setTaskItem(nextTaskItem);
        }
        setTaskData(nextTaskData);
        router.push(createCheckHref(result.taskId));
        setScreen({ type: "check", result, transition });
    }

    async function handleLevelStart() {
        if (!taskItem) return;

        setStartStatus("starting");
        setStartError("");

        const res = await fetch(`/api/tasks/${taskItem.id}/start`, { method: "POST" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
            setStartError(data?.error || "Не удалось запустить уровень");
            setStartStatus("");
            return;
        }

        if (data.taskItem) {
            setTaskItem(data.taskItem);
        }
        if (data.taskData) {
            setTaskData(data.taskData);
        }
        setStartStatus("");
    }

    function handleScreenChange(nextScreen: string) {
        if (!taskItem) return;
        replaceTaskUrl(taskItem.id, nextScreen);
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
                    started={taskItem?.started ?? false}
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
                    started={taskItem?.started ?? false}
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
                            router.push(createTaskHref(screen.transition.taskId));
                            setScreen({ type: "task", screen: "component" });
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
                        );
                    }}
                />
            ) : null}

            {screen.type === "task" && taskItem && taskData ? (
                taskItem.progress.currentLevelStarted ? (
                    <Workbench
                        taskItem={taskItem}
                        taskData={taskData}
                        onTaskItemChange={handleTaskItemChange}
                        onTaskDataChange={setTaskData}
                        onBackToLevelList={() => handleReturnToLevelList(taskItem.progress.currentLevelId)}
                        onCheckResult={handleCheckResult}
                        onTransition={handleTransition}
                        activeScreen={screen.screen}
                        onScreenChange={handleScreenChange}
                    />
                ) : (
                    <TaskLevelStart
                        taskItem={taskItem}
                        taskData={taskData}
                        startStatus={startStatus}
                        startError={startError}
                        onStart={() => void handleLevelStart()}
                        onBackToLevelList={() => handleReturnToLevelList(taskItem.progress.currentLevelId)}
                    />
                )
            ) : null}
        </main>
    );
}
export { Lab }
