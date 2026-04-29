type PanelProps = {
  title: string;
  children: React.ReactNode;
};

export default function Panel({ title, children }: PanelProps) {
  return (
    <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </header>

      <div className="p-4">{children}</div>
    </section>
  );
}