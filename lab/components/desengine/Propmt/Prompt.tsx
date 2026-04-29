import { PromptFileList } from "./PromptFile";
import { PromptText } from "./PromptText";
import { PromptControls } from "./PromptControls";
import { BaseProps, BaseStyles } from "../Base";

type PromptProps = BaseProps; 

function Prompt({}: PromptProps) {
    return (
        <div className={`${BaseStyles.frameRow} h-64`}>
            <PromptText />
            <div className="flex flex-2 flex-col h-full">
                <PromptFileList />
                <PromptControls />
            </div>
        </div>
    );
}

export {
 Prompt,
    type PromptProps
}