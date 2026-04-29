import { BaseProps } from "../Base";
import { LabData } from "../Lab";
import { LabFileKey } from "../Lab/props";

type CodeProps = BaseProps & {
    id?: LabFileKey;
    labData: LabData;
}

export { type CodeProps }