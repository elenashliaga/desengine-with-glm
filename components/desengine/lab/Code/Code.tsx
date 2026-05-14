"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { CodeProps } from "./props";
import { BaseStyles } from "@/components/desengine/platform/Base";
import { MonacoCodeEditor } from "./MonacoCodeEditor";
import { Button } from "@/components/ui/button";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { TabsStyles } from "./styles"
import { taskWorkbenchFiles } from "@/lib/platform/client";
import { isEditorSaveHotkey } from "@/lib/editor/editors";

function Code({
  id,
  taskData,
  onTaskDataChange,
  onFileChange,
  onSaveShortcut,
  dirtyFileIds = [],
}: CodeProps & { id: string }) {
  const [copied, setCopied] = useState(false);
  const currentFile = id ? taskWorkbenchFiles.find((file) => file.id === id) : null;
  const isDirty = id ? dirtyFileIds.includes(id) : false;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  if (!id || !currentFile) {
    return null;
  }

  const fileContent = taskData.contentByFileId[id] ?? "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function handleEditorKeyDownCapture(event: ReactKeyboardEvent<HTMLDivElement>) {
    const isSaveHotkey = isEditorSaveHotkey(event);

    if (!isSaveHotkey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onSaveShortcut?.();
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex items-center gap-2 px-1 text-sm text-black/80">
        <strong>{currentFile.title}</strong>
        {isDirty ? (
          <span
            aria-hidden="true"
            className="inline-block size-2.5 rounded-full bg-destructive"
          />
        ) : null}
        <span className="text-xs text-black/50">
          <code>{currentFile.fileName}</code>
        </span>
      </div>

      <div
        className={[
          "relative min-h-0 flex-1 overflow-hidden rounded-2xl border bg-[#fbf8f2]",
          isDirty ? "border-destructive/40" : "border-black/10",
        ].join(" ")}
        onKeyDownCapture={handleEditorKeyDownCapture}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
          className="absolute right-3 top-3 z-10 gap-2 border-black bg-black text-white shadow-sm hover:bg-black/90 hover:text-white"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Скопировано" : "Скопировать"}
        </Button>

        <MonacoCodeEditor
          fileId={id}
          fileName={currentFile.fileName}
          value={fileContent}
          onSaveShortcut={onSaveShortcut}
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
    </div>
  );
}

function CodeTab({ title, file, isDirty }: { title: string; file: string; isDirty: boolean }) {
  return(
    <div className="w-full space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-sm"><strong>{title}</strong></p>
        {isDirty ? (
          <span
            aria-hidden="true"
            className="inline-block size-2.5 rounded-full bg-destructive"
          />
        ) : null}
      </div>
      <p className="text-xs opacity-70"><code>{file}</code></p>
    </div>
  );
}

function CodeTabs({
  taskData,
  onTaskDataChange,
  onFileChange,
  onSaveShortcut,
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
      className={`${BaseStyles.frameRow} h-[34rem] gap-3 lg:flex-row`}
    >
      <div className="min-h-0 flex-1 p-0">
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
              onSaveShortcut={onSaveShortcut}
              dirtyFileIds={dirtyFileIds}
            />
          </TabsContent>
        ))}
      </div>

      <TabsList className={TabsStyles.list}>
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
  onSaveShortcut,
  activeFileId,
  onActiveFileIdChange,
  dirtyFileIds = [],
} : CodeProps) {
  return (
    <CodeTabs
      taskData={taskData}
      onTaskDataChange={onTaskDataChange}
      onFileChange={onFileChange}
      onSaveShortcut={onSaveShortcut}
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
