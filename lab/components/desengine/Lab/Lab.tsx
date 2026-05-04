"use client";

import { useState } from "react";
import { LabSelect } from "../LabSelect";
import { LabWorkbench } from "../LabWorkbench";
import { LabProps } from "./props"

function Lab({initTaskItem, initTaskData, taskListItems} : LabProps) {
    const [taskItem, setTaskItem] = useState(initTaskItem);
    const [taskData, setTaskData] = useState(initTaskData);

    function handleTaskChange(taskId: string) {
        // потом: сохранить текущий draft, загрузить новую задачу
    }

    return (
        <main>
            <LabSelect
                taskListItems={taskListItems}
                currentTaskId={taskItem.id}
                onTaskChange={handleTaskChange}
            />

            <LabWorkbench
                taskItem={taskItem}
                taskData={taskData}
                onTaskDataChange={null}
            />
        </main>
    );
}
export { Lab }