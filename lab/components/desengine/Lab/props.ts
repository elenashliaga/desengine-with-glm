import { BaseProps } from "../Base";
import { labFiles } from "./config";

type LabData = {
    task: string;
    codeByKey: initialCodeByKey,
}

type LabProps = BaseProps & {
    initialLabData: LabData;
}

type LabSelectProps = {
    task: LabData["task"];
    onTaskChange: (task: LabData["task"]) => void;
}

type LabFile = (typeof labFiles)[number]
type LabFileKey = LabFile["key"]

export {
    type LabData,
    type LabProps,
    type LabSelectProps,
    type LabFile,
    type LabFileKey,
}