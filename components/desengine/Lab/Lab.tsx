"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LabWorkbench } from "../LabWorkbench";
import { LevelOverview } from "../LevelOverview";
import { TaskLevelTransition } from "../TaskLevelTransition";
import { LabProps } from "./props"
import type { LabScreenState, LevelOverview as LevelOverviewData, TaskListItem, TaskTransition } from "@/lib/types";
import { createLevelsPath, createTaskNextPath, createTaskPath } from "@/lib/navigation";

function createLevelHref(levelId?: string | null) {
    return createLevelsPath(levelId);
}

function createTaskHref(taskId: string, screen?: string | null) {
    return createTaskPath(taskId, screen);
}

function createTransitionHref(transition: TaskTransition) {
    return createTaskNextPath(transition.taskId);
}

function Lab({initLevelOverview, initScreen, initTaskItem, initTaskData} : LabProps) {
    const router = useRouter();
    const [screen, setScreen] = useState<LabScreenState>(initScreen);
    const [levelOverview, setLevelOverview] = useState<LevelOverviewData>(initLevelOverview);
    const [taskItem, setTaskItem] = useState(initTaskItem);
    const [taskData, setTaskData] = useState(initTaskData);
    const [status, setStatus] = useState<string>("");
    const [started, setStarted] = useState<boolean>(Boolean(initTaskItem?.started));

    async function initializeCurrentLevel(taskId: string) {
        setStatus("Инициирующий запуск уровня…");

        const res = await fetch(`/api/tasks/${taskId}/start`, { method: "POST" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
            setStatus("");
            return false;
        }

        setTaskItem(data.taskItem);
        setTaskData(data.taskData);
        setStarted(true);
        setStatus("");
        return true;
    }

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

        if (data.taskItem && Boolean(data.started) && !data.taskItem.progress.currentLevelInitialized) {
            await initializeCurrentLevel(taskId);
        }
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

    function handleScreenChange(nextScreen: string) {
        if (!taskItem) return;
        router.push(createTaskHref(taskItem.id, nextScreen));
        setScreen({ type: "task", screen: nextScreen });
    }

    useEffect(() => {
        if (screen.type !== "task") return;
        if (!taskItem || !started) return;
        if (taskItem.progress.currentLevelInitialized) return;

        const currentTaskId = taskItem.id;
        const timeoutId = window.setTimeout(() => {
            void initializeCurrentLevel(currentTaskId);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [screen, started, taskItem]);

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
                    pending={status.length > 0}
                    onContinue={() => {
                        router.push(createTaskHref(screen.transition.taskId));
                        setScreen({ type: "task", screen: "component" });
                    }}
                    onBackToLevelList={() => handleReturnToLevelList(screen.transition.toLevel?.id)}
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
                    onTransition={handleTransition}
                    activeScreen={screen.screen}
                    onScreenChange={handleScreenChange}
                />
            ) : null}
        </main>
    );
}
export { Lab }
