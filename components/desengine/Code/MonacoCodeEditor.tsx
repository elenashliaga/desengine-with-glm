"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";

type MonacoEditorProps = {
  fileId: string;
  fileName: string;
  value: string;
  onChange: (nextValue: string) => void;
};

type MonacoReactEditorProps = {
  defaultLanguage?: string;
  height?: string;
  loading?: ReactNode;
  onChange?: (value: string | undefined) => void;
  options?: Record<string, unknown>;
  path?: string;
  theme?: string;
  value?: string;
};

function getEditorLanguage(fileName: string) {
  if (fileName.endsWith(".json")) {
    return "json";
  }

  if (fileName.endsWith(".tsx")) {
    return "typescript";
  }

  if (fileName.endsWith(".ts")) {
    return "typescript";
  }

  if (fileName.endsWith(".js")) {
    return "javascript";
  }

  if (fileName.endsWith(".css")) {
    return "css";
  }

  return "plaintext";
}

function FallbackCodeEditor({ fileId, value, onChange }: MonacoEditorProps) {
  return (
    <Textarea
      id={fileId}
      placeholder={fileId}
      className="h-full w-full rounded-none border-0 bg-transparent p-3 font-mono text-sm shadow-none focus-visible:ring-0"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function MonacoCodeEditor({ fileId, fileName, value, onChange }: MonacoEditorProps) {
  const [Editor, setEditor] = useState<ComponentType<MonacoReactEditorProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void import("@monaco-editor/react")
      .then((module) => {
        if (!cancelled) {
          setEditor(() => module.default);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const language = useMemo(() => getEditorLanguage(fileName), [fileName]);

  if (loadFailed || Editor === null) {
    return <FallbackCodeEditor fileId={fileId} fileName={fileName} value={value} onChange={onChange} />;
  }

  return (
    <Editor
      path={fileName}
      defaultLanguage={language}
      height="100%"
      theme="vs-dark"
      value={value}
      loading={
        <FallbackCodeEditor fileId={fileId} fileName={fileName} value={value} onChange={onChange} />
      }
      onChange={(nextValue) => onChange(nextValue ?? "")}
      options={{
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: "on",
        minimap: { enabled: false },
        padding: { top: 12, bottom: 12 },
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "on",
      }}
    />
  );
}

export { MonacoCodeEditor };
