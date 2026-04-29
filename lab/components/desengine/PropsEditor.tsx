"use client";

import { Textarea } from "../ui/textarea";
import Panel from "./Panel";

type PropsEditorProps = {
  propsText: string;
  onPropsTextChange: (value: string) => void;
  error: string;
};

export default function PropsEditor({
  propsText,
  onPropsTextChange,
  error
}: PropsEditorProps) {
  return (
    <Panel title="Props JSON">
      <div className="space-y-4">
        <Textarea
          value={propsText}
          onChange={(event) => onPropsTextChange(event.target.value)}
          rows={10}
          className="font-mono text-sm"
        />

        {error && (
          <pre className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
            JSON error: {error}
          </pre>
        )}
      </div>
    </Panel>
  );
}