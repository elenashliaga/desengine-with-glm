"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import type * as Monaco from "monaco-editor";

type MonacoInstance = {
  languages: {
    typescript: {
      typescriptDefaults: {
        setDiagnosticsOptions(options: {
          noSemanticValidation?: boolean;
          noSuggestionDiagnostics?: boolean;
          noSyntaxValidation?: boolean;
        }): void;
      };
      javascriptDefaults: {
        setDiagnosticsOptions(options: {
          noSemanticValidation?: boolean;
          noSuggestionDiagnostics?: boolean;
          noSyntaxValidation?: boolean;
        }): void;
      };
    };
  };
};

type MonacoEditorProps = {
  fileId: string;
  fileName: string;
  value: string;
  onChange: (nextValue: string) => void;
};

type MonacoReactEditorProps = {
  beforeMount?: (monaco: MonacoInstance) => void;
  defaultLanguage?: string;
  height?: string;
  loading?: ReactNode;
  onChange?: (value: string | undefined) => void;
  options?: Record<string, unknown>;
  path?: string;
  theme?: string;
  value?: string;
};

// type MonacoInstance = typeof import("monaco-editor");

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
      className="h-full w-full rounded-none border-0 bg-transparent p-3 font-mono text-sm text-black shadow-none focus-visible:ring-0"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function configureLabDiagnostics(monaco: MonacoInstance) {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSuggestionDiagnostics: true,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSuggestionDiagnostics: true,
    noSyntaxValidation: false,
  });
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
      beforeMount={configureLabDiagnostics}
      defaultLanguage={language}
      height="100%"
      theme="light"
      value={value}
      loading={
        <FallbackCodeEditor fileId={fileId} fileName={fileName} value={value} onChange={onChange} />
      }
      onChange={(nextValue) => onChange(nextValue ?? "")}
      options={{
        automaticLayout: true,
        bracketPairColorization: { enabled: false },
        fontSize: 14,
        guides: {
          bracketPairs: false,
          indentation: true,
        },
        lineNumbers: "on",
        minimap: { enabled: false },
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        roundedSelection: false,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        wordWrap: "on",
      }}
    />
  );
}

export { MonacoCodeEditor };
