"use client";

import { type LabSelectProps } from "./props";
import { BaseStyles } from "../Base";

function LabSelect({currentTaskId, taskListItems=[], onTaskChange } : LabSelectProps) {
    return(
        <div className={BaseStyles.frameRow}>
            <p>Выберите задачу:</p>
            <select defaultValue={currentTaskId}>
                {taskListItems.map((t) => (
                    <option key={t.id} value={t.id}>{t.id}</option>    
                ))}
            </select>
        </div>
    );
}

export { LabSelect }