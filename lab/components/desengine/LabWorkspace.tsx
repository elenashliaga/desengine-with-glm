"use client";

import { useState } from "react";
import Playground from "./Playground";
import RenderPreview from "./RenderPreview";

type LabWorkspaceProps = {
  initialPropsText: string;
  code: string;
};

export default function LabWorkspace({
  initialPropsText,
  code
}: LabWorkspaceProps) {
  const [propsText, setPropsText] = useState(initialPropsText);

  let parsedProps: Record<string, unknown> = {};
  let error = "";

  try {
    parsedProps = JSON.parse(propsText);
  } catch (e) {
    error = e instanceof Error ? e.message : "Invalid JSON";
  }

  return (
    <div className="space-y-6">
      <RenderPreview
        parsedProps={parsedProps}
        error={error}
      />

      <Playground
        propsText={propsText}
        onPropsTextChange={setPropsText}
        code={code}
        error={error}
      />
    </div>
  );
}