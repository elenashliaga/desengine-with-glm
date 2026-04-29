type PageShellProps = {
  children: React.ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">desengine lab</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Локальная лаборатория генерации учебных React-компонентов.
          </p>
        </header>

        {children}
      </div>
    </main>
  );
};