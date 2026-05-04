"use client";

import { Textarea } from "@/components/ui/textarea";
import { CodeProps } from "./props";
import { BaseStyles } from "../Base";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { TabsStyles } from "./styles"
import { useState } from "react";
import { taskWorkbenchFiles } from "@/lib/client";

function Code({ id, taskData, onTaskDataChange }: CodeProps) {
  if (!id) return null;
  return (
      <div className="w-full h-full p-0 gap-0">
          <Textarea
            id={id}
            placeholder={id} 
            className="w-full h-full p-0 gap-0"
            value={taskData.contentByFileId[id] ?? ""}
            onChange={(event) => {
              if (!onTaskDataChange) return;
              onTaskDataChange({
                ...taskData,
                contentByFileId: {
                  ...taskData.contentByFileId,
                  [id]: event.target.value,
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

function CodeTabs({ taskData, onTaskDataChange } : CodeProps) {
  const [tab, setTab] = useState("component");
  const codeFiles = taskWorkbenchFiles.filter((f) => f.edit === true);

  return (
    <Tabs
      defaultValue={codeFiles[0]?.id}
      value={tab}
      onValueChange={setTab}
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

function CodeList({ taskData, onTaskDataChange } : CodeProps) {
  return (<CodeTabs taskData={taskData} onTaskDataChange={onTaskDataChange} />);
}

export {
    Code,
    CodeList,
}
