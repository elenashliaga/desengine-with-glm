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

function Code({
  id,
  taskData,
  onTaskDataChange,
  onFileChange,
  dirtyFileIds = [],
}: CodeProps & { id: string }) {
  if (!id) return null;
  const currentFile = taskWorkbenchFiles.find((file) => file.id === id);
  const isDirty = dirtyFileIds.includes(id);

  if (!currentFile) {
    return null;
  }

  return (
    <div
      className={[
        "h-full w-full overflow-hidden rounded-md border bg-[#111111]",
        isDirty ? "border-destructive" : "border-white/10",
      ].join(" ")}
    >
      <MonacoCodeEditor
        fileId={id}
        fileName={currentFile.fileName}
        value={taskData.contentByFileId[id] ?? ""}
        onChange={(nextValue) => {
          if (onFileChange) {
            onFileChange(id, nextValue);
            return;
          }

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

function CodeTab({ title, file, isDirty }: { title: string; file: string; isDirty: boolean }) {
  return(
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p><strong>{title}</strong></p>
        {isDirty ? (
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-full bg-destructive"
          />
        ) : null}
      </div>
      <p><small><code>{file}</code></small></p>
    </div>
  );
}

function CodeTabs({
  taskData,
  onTaskDataChange,
  onFileChange,
  activeFileId,
  onActiveFileIdChange,
  dirtyFileIds = [],
} : CodeProps) {
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
            <Code
              id={file.id}
              taskData={taskData}
              onTaskDataChange={onTaskDataChange}
              onFileChange={onFileChange}
              dirtyFileIds={dirtyFileIds}
            />
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
            <CodeTab
              title={file.title}
              file={file.fileName}
              isDirty={dirtyFileIds.includes(file.id)}
            />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function CodeList({
  taskData,
  onTaskDataChange,
  onFileChange,
  activeFileId,
  onActiveFileIdChange,
  dirtyFileIds = [],
} : CodeProps) {
  return (
    <CodeTabs
      taskData={taskData}
      onTaskDataChange={onTaskDataChange}
      onFileChange={onFileChange}
      activeFileId={activeFileId}
      onActiveFileIdChange={onActiveFileIdChange}
      dirtyFileIds={dirtyFileIds}
    />
  );
}

export {
    Code,
    CodeList,
}
