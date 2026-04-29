"use client";

import { type LabSelectProps, type LabProps } from "./props";

import { InOut } from "../InOut";
import { Prompt } from "../Propmt";
import { useState } from "react";
import { CodeList } from "../Code";
import { BaseStyles } from "../Base";

function LabSelect({ task, onTaskChange } : LabSelectProps) {
    return(
        <div className={BaseStyles.frameRow}>
            <p>Выберите задачу:</p>
            <select
                value={task}
                onChange={(t) => onTaskChange(t.target.value)}
            >
                <option value="innovatika-listitem-tariff-option">innovatika-listitem-tariff-option</option>
                <option value="innovatika-segment-tariff-summary">innovatika-segment-tariff-summary</option>
                <option value="innovatika-status-indicator-value">innovatika-status-indicator-value</option>
            </select>
        </div>
    );
}

function Lab({initialLabData}: LabProps) {
    const [labData, setLabData] = useState(initialLabData);
    return (
        <div className={BaseStyles.frameCol}>
            <LabSelect 
                task={labData.task}
                onTaskChange={
                    (task: string) =>
                    setLabData((prev) => ({ ...prev, task }))
                }
            />
            <InOut task={labData.task}/>
            <CodeList labData={labData}/>
            <Prompt />
        </div>
    );
}


export {
    Lab,
}