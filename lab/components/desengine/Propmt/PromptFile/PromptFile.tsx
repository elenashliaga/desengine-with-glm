import { ReactNode } from "react";
import { labFiles } from "../../Lab/config";

type PromptFileProps = {
    title?: string;
    children?: ReactNode;
}

function PromptFile({title="Файл"}: PromptFileProps) {
    return (
        <div><input type="checkbox" value={title}/> <code>{title}</code></div>
    );
}

function PromptFileList({ }: PromptFileProps) {
    return (
        <div>
            {labFiles.map(file => (
                <PromptFile
                    key={file.key}
                    title={file.fileName}
                />
            ))}
        </div>
    );
}

export {
    PromptFile,
    PromptFileList,
    type PromptFileProps
}