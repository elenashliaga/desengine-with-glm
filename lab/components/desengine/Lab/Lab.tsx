"use client";

import { useState } from "react";
import { LabSelect } from "../LabSelect";
import { LabWorkbench } from "../LabWorkbench";
import { LabProps } from "./props"

function Lab({initTaskItem, initTaskData, taskListItems} : LabProps) {
    const [taskItem, setTaskItem] = useState(initTaskItem);
    const [taskData, setTaskData] = useState(initTaskData);
    const [status, setStatus] = useState<string>("");
    const [started, setStarted] = useState<boolean>(Boolean(initTaskItem.started));

    async function handleTaskChange(taskId: string) {
        setStatus("Загрузка задания…");

        const res = await fetch(`/api/tasks/${taskId}`, { method: "GET" });
        const data = await res.json();

        if (!data?.ok) {
            setStatus(data?.error || "Ошибка загрузки задания");
            return;
        }

        setTaskItem(data.taskItem);
        setTaskData(data.taskData);
        setStarted(Boolean(data.started));
        setStatus("");
    }

    return (
        <main>
            <LabSelect
                taskListItems={taskListItems}
                currentTaskId={taskItem.id}
                onTaskChange={handleTaskChange}
            />

            {status && (
                <p className="text-sm text-muted-foreground">{status}</p>
            )}

            <LabWorkbench
                taskItem={taskItem}
                taskData={taskData}
                onTaskDataChange={setTaskData}
                started={started}
                onStartedChange={setStarted}
            />
        </main>
    );
}
export { Lab }
