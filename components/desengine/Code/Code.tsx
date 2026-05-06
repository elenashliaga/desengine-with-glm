"use client";

import { CodeProps } from "./props";
import { BaseStyles } from "../Base";
import { MonacoCodeEditor } from "./MonacoCodeEditor";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { TabsStyles } from "./styles"
import { taskWorkbenchFiles } from "@/lib/client";

function Code({ id, taskData, onTaskDataChange }: CodeProps & { id: string }) {
  if (!id) return null;
  const currentFile = taskWorkbenchFiles.find((file) => file.id === id);

  if (!currentFile) {
    return null;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-md border border-white/10 bg-[#111111]">
      <MonacoCodeEditor
        fileId={id}
        fileName={currentFile.fileName}
        value={taskData.contentByFileId[id] ?? ""}
        onChange={(nextValue) => {
          if (!onTaskDataChange) return;
          onTaskDataChange({
            ...taskData,
            contentByFileId: {
              ...taskData.contentByFileId,
              [id]: nextValue,
            },
          });
        }}
      />
    </div>
  );
}

function CodeTab({ title, file }: { title: string; file: string }) {
  return(
    <div className="w-full">
      <p><strong>{title}</strong></p>
      <p><small><code>{file}</code></small></p>
    </div>
  );
}

function CodeTabs({ taskData, onTaskDataChange, activeFileId, onActiveFileIdChange } : CodeProps) {
  const editableFileIds = taskData.labContext?.editableFileIds ?? [];
  const codeFiles = taskWorkbenchFiles.filter((f) => f.edit === true && editableFileIds.includes(f.id));
  const fallbackTab = codeFiles[0]?.id ?? "component"
  const tab = codeFiles.some((file) => file.id === activeFileId) ? activeFileId : fallbackTab

  if (codeFiles.length === 0) {
    return (
      <div className={`${BaseStyles.frameRow} h-96 items-center justify-center text-muted-foreground`}>
        Для этого уровня пока нет доступных файлов для редактирования.
      </div>
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(nextValue) => onActiveFileIdChange?.(nextValue)}
      className={`${BaseStyles.frameRow} h-96`}
    >
      <div className="flex-6 p-0 gap-0">
        {codeFiles.map((file) => (
          <TabsContent
            key={file.id}
            value={file.id}
            className={TabsStyles.content}
          >
            <Code id={file.id} taskData={taskData} onTaskDataChange={onTaskDataChange} />
          </TabsContent>
        ))}
      </div>

      <TabsList className={`${TabsStyles.list} flex flex-2 flex-col`}>
        {codeFiles.map((file) => (
          <TabsTrigger
            key={file.id}
            value={file.id}
            className={TabsStyles.trigger}
          >
            <CodeTab title={file.title} file={file.fileName} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function CodeList({ taskData, onTaskDataChange, activeFileId, onActiveFileIdChange } : CodeProps) {
  return (
    <CodeTabs
      taskData={taskData}
      onTaskDataChange={onTaskDataChange}
      activeFileId={activeFileId}
      onActiveFileIdChange={onActiveFileIdChange}
    />
  );
}

export {
    Code,
    CodeList,
}
