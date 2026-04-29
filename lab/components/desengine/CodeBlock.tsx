import Panel from "./Panel";

type CodeBlockProps = {
  code: string;
};

export default function CodeBlock({ code }: CodeBlockProps) {
  return (
    <Panel title="Generated code">
      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
        <code>{code}</code>
      </pre>
    </Panel>
  );
}