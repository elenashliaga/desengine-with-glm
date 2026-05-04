"use client";

import { type LabWorkbenchProps } from "./props";

import { InOut } from "../InOut";
import { Prompt } from "../Propmt";
import { CodeList } from "../Code";
import { BaseStyles } from "../Base";

function LabWorkbench({taskItem, taskData, onTaskDataChange}: LabWorkbenchProps) {

    return (
        <div className={BaseStyles.frameCol}>
            <p>Рабочий стол</p>
            <InOut task={taskItem.id}/>
            <CodeList taskData={taskData}/>
            <Prompt />
        </div>
    );
}


export { LabWorkbench }