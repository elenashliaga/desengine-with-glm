"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LabWorkbench } from "../LabWorkbench";
import { LevelOverview } from "../LevelOverview";
import { TaskLevelTransition } from "../TaskLevelTransition";
import { LabProps } from "./props"
import type { LabScreenState, LevelOverview as LevelOverviewData, TaskListItem, TaskTransition } from "@/lib/types";

function createLevelHref(levelId?: string | null) {
    if (!levelId) return "/lab";
    return `/lab?screen=level&levelId=${encodeURIComponent(levelId)}`;
}

function createTaskHref(taskId: string) {
    return `/lab?screen=task&taskId=${encodeURIComponent(taskId)}`;
}

function createTransitionHref(transition: TaskTransition) {
    const params = new URLSearchParams({
        screen: "transition",
        taskId: transition.taskId,
        fromLevelId: transition.fromLevel.id,
        reason: transition.reason,
    });

    if (transition.toLevel) {
        params.set("toLevelId", transition.toLevel.id);
    }

    return `/lab?${params.toString()}`;
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
            setStatus(data?.error || "Ошибка инициирующего запуска уровня");
            return false;
        }

        setTaskItem(data.taskItem);
        setTaskData(data.taskData);
        setStarted(true);
        setStatus("");
        return true;
    }

    async function loadLevelOverview(levelId?: string) {
        const ref = levelId ? `/api/levels/${levelId}` : "/api/levels/current";
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
        setScreen({ type: "task" });
        setStatus("");

        if (data.taskItem && Boolean(data.started) && !data.taskItem.progress.currentLevelInitialized) {
            await initializeCurrentLevel(taskId);
        }
    }

    async function handleNavigateLevel(levelId: string) {
        setStatus("Загрузка уровня…");
        router.push(createLevelHref(levelId));
        await loadLevelOverview(levelId);
    }

    async function handleReturnToLevelList(levelId?: string) {
        setStatus("Возвращаю к списку задач…");
        router.push(createLevelHref(levelId));
        const overview = await loadLevelOverview(levelId);
        if (overview) {
            setScreen({ type: "level" });
        }
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
                <p className="text-sm text-muted-foreground">{status}</p>
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
                        setScreen({ type: "task" });
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
                />
            ) : null}
        </main>
    );
}
export { Lab }
