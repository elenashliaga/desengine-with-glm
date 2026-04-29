import Generated from "@/generated/Generated";
import Panel from "./Panel";

type RenderPreviewProps = {
  parsedProps: Record<string, unknown>;
  error: string;
};

export default function RenderPreview({
  parsedProps,
  error
}: RenderPreviewProps) {
  return (
    <Panel title="Rendered result">
      <div className="rounded-md border bg-background p-4">
        {!error && <Generated {...parsedProps} />}
      </div>
    </Panel>
  );
}