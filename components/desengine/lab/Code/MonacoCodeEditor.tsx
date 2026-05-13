"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { isEditorSaveHotkey } from "@/lib/editor/editor-shortcuts";

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
  onSaveShortcut?: () => void;
};

type MonacoReactEditorProps = {
  beforeMount?: (monaco: MonacoInstance) => void;
  defaultLanguage?: string;
  height?: string;
  loading?: ReactNode;
  onMount?: (editor: MonacoEditorInstance, monaco: MonacoGlobalInstance) => void;
  onChange?: (value: string | undefined) => void;
  options?: Record<string, unknown>;
  path?: string;
  theme?: string;
  value?: string;
};

type MonacoEditorInstance = {
  addCommand: (keybinding: number, handler: () => void) => void;
}

type MonacoGlobalInstance = MonacoInstance & {
  KeyMod: {
    CtrlCmd: number;
  };
  KeyCode: {
    KeyS: number;
  };
}

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

function FallbackCodeEditor({ fileId, value, onChange, onSaveShortcut }: MonacoEditorProps) {
  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    const isSaveHotkey = isEditorSaveHotkey(event);

    if (!isSaveHotkey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onSaveShortcut?.();
  }

  return (
    <Textarea
      id={fileId}
      placeholder={fileId}
      className="h-full w-full rounded-none border-0 bg-transparent p-3 font-mono text-sm text-black shadow-none focus-visible:ring-0"
      value={value}
      onKeyDown={handleKeyDown}
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

function MonacoCodeEditor({ fileId, fileName, value, onChange, onSaveShortcut }: MonacoEditorProps) {
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
    return <FallbackCodeEditor fileId={fileId} fileName={fileName} value={value} onChange={onChange} onSaveShortcut={onSaveShortcut} />;
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
        <FallbackCodeEditor fileId={fileId} fileName={fileName} value={value} onChange={onChange} onSaveShortcut={onSaveShortcut} />
      }
      onMount={(editor, monaco) => {
        if (!onSaveShortcut) {
          return;
        }

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          onSaveShortcut();
        });
      }}
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
