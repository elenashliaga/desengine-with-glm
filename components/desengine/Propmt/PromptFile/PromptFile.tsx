import { Checkbox } from "@/components/ui/checkbox";
import { taskWorkbenchFiles } from "@/lib/client";

type PromptFileProps = {
    fileId: string;
    title: string;
    checked: boolean;
    disabled?: boolean;
    onToggle: (fileId: string, checked: boolean) => void;
}

function PromptFile({ fileId, title, checked, disabled, onToggle }: PromptFileProps) {
    return (
        <label className="flex items-center gap-2">
          <Checkbox
            checked={checked}
            disabled={disabled}
            onCheckedChange={(nextChecked) => onToggle(fileId, nextChecked === true)}
          />
          <code>{title}</code>
        </label>
    );
}

type PromptFileListProps = {
    fileIds: string[];
    selectedFileIds: string[];
    disabled?: boolean;
    onToggle: (fileId: string, checked: boolean) => void;
}

function PromptFileList({ fileIds, selectedFileIds, disabled, onToggle }: PromptFileListProps) {
    const promptFiles = taskWorkbenchFiles.filter((file) => file.edit === true && fileIds.includes(file.id))

    return (
        <div className="space-y-1">
            {promptFiles.map((file) => (
                <PromptFile
                    key={file.id}
                    fileId={file.id}
                    title={file.fileName}
                    checked={selectedFileIds.includes(file.id)}
                    disabled={disabled}
                    onToggle={onToggle}
                />
            ))}
        </div>
    );
}

export {
    PromptFile,
    PromptFileList,
    type PromptFileProps,
} 
