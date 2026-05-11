import { Button } from "@/components/ui/button"
import { createSnapshotDataPath } from "@/lib/navigation"
import { formatPromptHistoryTimestamp } from "@/lib/prompt-history"
import type { PublishedSnapshot } from "@/lib/types"

type PublishedSnapshotViewProps = {
  snapshot: PublishedSnapshot
}

function PublishedSnapshotView({ snapshot }: PublishedSnapshotViewProps) {
  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-8 text-black md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-black/60">Публичный слепок задания</p>
              <h1 className="text-3xl font-semibold">Задача {snapshot.taskId}</h1>
              <p className="text-sm text-black/60">
                Опубликовано {formatPromptHistoryTimestamp(snapshot.publishedAt)}
              </p>
            </div>

            <Button type="button" variant="outline" asChild>
              <a href={createSnapshotDataPath(snapshot.id)} target="_blank" rel="noreferrer">
                Открыть JSON
              </a>
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Итоговые файлы</h2>
            <p className="text-sm text-black/60">
              Текстовые файлы рабочего набора компонента на момент публикации.
            </p>
          </div>

          <div className="space-y-4">
            {snapshot.files.map((file) => (
              <article key={file.fileId} className="overflow-hidden rounded-xl border border-black/10">
                <div className="border-b border-black/10 bg-[#f7f1e6] px-4 py-3">
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-sm text-black/60">{file.fileId}</p>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap bg-[#fffdf8] p-4 text-sm">
                  <code>{file.content || "// Пустой файл"}</code>
                </pre>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">История промптов</h2>
            <p className="text-sm text-black/60">
              Пользовательские запросы в порядке выполнения.
            </p>
          </div>

          {snapshot.promptHistory.length === 0 ? (
            <p className="text-sm text-black/60">История промптов пока пустая.</p>
          ) : (
            <div className="space-y-4">
              {snapshot.promptHistory.map((entry, index) => (
                <article key={`${entry.createdAt}-${index}`} className="rounded-xl border border-black/10 p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Запрос #{entry.iterationNumber ?? index + 1}</p>
                    <p className="text-sm text-black/60">
                      {entry.displayCreatedAt ?? formatPromptHistoryTimestamp(entry.createdAt)}
                    </p>
                    <p className="text-sm text-black/60">
                      Уровень: {entry.levelNumber ?? "не указан"}
                    </p>
                    {entry.selectedFileNames?.length ? (
                      <p className="text-sm text-black/60">
                        Отправлены: {entry.selectedFileNames.join(", ")}
                      </p>
                    ) : null}
                    {entry.changedFileNames?.length ? (
                      <p className="text-sm text-black/60">
                        Изменены: {entry.changedFileNames.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{entry.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export { PublishedSnapshotView }
