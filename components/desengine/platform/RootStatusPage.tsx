"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { SystemStatusPanel, type Instruction, type StatusItem } from "@/components/desengine/platform/SystemStatusPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTasksPath } from "@/lib/platform/navigation"

type RootStatusPageProps = {
  accessState: "valid" | "missing" | "expired"
  configured: boolean
  statusItems: StatusItem[]
  instructions: Instruction[]
}

export function RootStatusPage({ accessState, configured, statusItems, instructions }: RootStatusPageProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const hasAccess = accessState === "valid"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    startTransition(async () => {
      const response = await fetch("/api/access/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirectTo?: string }
        | null

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Не удалось проверить доступ.")
        return
      }

      router.push(data.redirectTo || createTasksPath())
      router.refresh()
    })
  }

  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <section className="tool-shell-surface">
          <div className="tool-panel-strong">
            <div className="space-y-2">
              <h2 className="font-semibold text-black">Допуск в лабораторию</h2>
              <p className="text-black/60">
                Введите email из allowlist, чтобы сразу открыть защищённую часть desengine.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-black/75">
                Email
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPending || !configured}
                  className="h-11 rounded-xl border-black/10 bg-[#f7f4ee] px-3 text-black"
                />
              </label>

              {error && <p className="tool-notice-error">{error}</p>}

              {!configured && (
                <p className="tool-notice-warning">
                  Проверка доступа пока не настроена. Сначала администратор должен задать
                  `ALLOWLIST_BASE_URL` и `ALLOWLIST_SALT` в `desengine.config.txt`.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isPending || !configured}
                className="h-11"
              >
                {isPending ? "Проверяем доступ…" : "Открыть защищённую лабораторию"}
              </Button>
            </form>
          </div>

          <div className="mt-6">
            <SystemStatusPanel
              statusItems={statusItems}
              instructions={instructions}
              title="Начало работы"
              description="Важно указать LLM-ключ и ввести email"
            />
          </div>

          <div className="mt-6 grid gap-3 text-black/70 md:grid-cols-3">
            <div className="tool-subcard">
              `/` остаётся публичной страницей состояния даже при неполной конфигурации локальной установки.
            </div>
            <div className="tool-subcard">
              `/tasks` и `/levels` остаются защищёнными маршрутами и требуют актуальный allowlist-допуск.
            </div>
            <div className="tool-subcard">
              {hasAccess
                ? "Текущий допуск уже выдан. Рабочий каталог задач доступен на `/tasks`."
                : accessState === "expired"
                  ? "Предыдущий допуск истёк. Для защищённой части нужно снова пройти проверку на `/auth`."
                  : "Если диагностика уже зелёная, следующий пользовательский шаг — пройти проверку на `/auth`."}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
