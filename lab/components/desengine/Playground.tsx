import PropsEditor from "./PropsEditor";
import CodeBlock from "./CodeBlock";

type PlaygroundProps = {
  propsText: string;
  onPropsTextChange: (value: string) => void;
  code: string;
  error: string;
};

export default function Playground({
  propsText,
  onPropsTextChange,
  code,
  error
}: PlaygroundProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PropsEditor
        propsText={propsText}
        onPropsTextChange={onPropsTextChange}
        error={error}
      />

      <CodeBlock code={code} />
    </div>
  );
}