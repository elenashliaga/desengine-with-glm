"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

type SnapshotPublishPanelProps = {
  pending: boolean
  status: string
  error: string
  snapshotUrl: string
  onPublish: () => void
}

function SnapshotPublishPanel({
  pending,
  status,
  error,
  snapshotUrl,
  onPublish,
}: SnapshotPublishPanelProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snapshotUrl)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-[#f7f1e6] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium text-black">Публичный слепок</p>
          <p className="text-sm text-black/70">
            Публикует итоговые файлы набора компонента и историю промптов без внутренних метрик и конфигурации.
          </p>
        </div>

        <Button type="button" variant="outline" disabled={pending} onClick={onPublish}>
          {pending ? "Публикация…" : "Опубликовать слепок"}
        </Button>
      </div>

      {status ? (
        <p className="mt-3 text-sm text-muted-foreground">{status}</p>
      ) : null}

      {error ? (
        <pre className="mt-3 whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </pre>
      ) : null}

      {snapshotUrl ? (
        <div className="mt-3 space-y-2 rounded-lg border bg-white/85 p-3">
          <p className="text-sm font-medium">Слепок опубликован</p>
          <a
            href={snapshotUrl}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-sm text-foreground underline underline-offset-4"
          >
            {snapshotUrl}
          </a>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopy()}>
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={snapshotUrl} target="_blank" rel="noreferrer">
                Открыть слепок
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export { SnapshotPublishPanel }
