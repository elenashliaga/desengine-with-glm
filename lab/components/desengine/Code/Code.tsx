import { Textarea } from "@/components/ui/textarea";
import { CodeProps } from "./props";
import { BaseStyles } from "../Base";
import { labFiles } from "../Lab/config";


import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { TabsStyles } from "./styles"
import { useState } from "react";

function Code({ id, labData }: CodeProps) {
  if(!id) return;
  return (
      <div className="w-full h-full p-0 gap-0">
          <Textarea
            id={id}
            placeholder={id} 
            className="w-full h-full p-0 gap-0"
            defaultValue={labData.codeByKey[id]}
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

function CodeTabs({labData} : CodeProps) {
  const [tab, setTab] = useState("markup");
  const codeFiles = labFiles.filter(f => f.edit === true);

  return (
    <Tabs
      defaultValue={codeFiles[0].key}
      value={tab}
      onValueChange={setTab}
      className={`${BaseStyles.frameRow} h-96`}
    >
      <div className="flex-6 p-0 gap-0">
        {codeFiles.map((file) => (
          <TabsContent
            key={file.key}
            value={file.key}
            className={TabsStyles.content}
          >
            <Code id={file.key} labData={labData}/>
          </TabsContent>
        ))}
      </div>

      <TabsList className={`${TabsStyles.list} flex flex-2 flex-col`}>
        {codeFiles.map((file) => (
          <TabsTrigger
            key={file.key}
            value={file.key}
            className={TabsStyles.trigger}
          >
            <CodeTab title={file.title} file={file.fileName} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function CodeList({labData} : CodeProps) {
  return (<CodeTabs labData={labData}/>);
}

export {
    Code,
    CodeList,
}