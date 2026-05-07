"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTasksPath } from "@/lib/navigation"
import { SystemStatusPanel, type Instruction, type StatusItem } from "@/components/desengine/SystemStatusPanel"

type AccessGateProps = {
  accessState: "valid" | "missing" | "expired"
  configured: boolean
  statusItems: StatusItem[]
  instructions: Instruction[]
}

function AccessGate({ accessState, configured, statusItems, instructions }: AccessGateProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

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
      <div className="tool-shell-frame-center">
        <section className="tool-shell-surface-split">
          <div>
            <div className="tool-eyebrow">desengine lab</div>

            <div className="mt-7">
              <SystemStatusPanel
                statusItems={statusItems}
                instructions={instructions}
                title="Страница допуска показывает, что уже готово для запуска лаборатории, а что ещё нужно настроить."
                description="До допуска здесь доступны только диагностика и инструкция. Список задач и рабочая часть лаборатории откроются только после успешной allowlist-проверки по email."
              />
            </div>
          </div>

          <div className="tool-panel-strong">
            <div className="space-y-2">
              <h2 className="font-semibold text-black">Допуск в лабораторию</h2>
              <p className="text-black/60">
                После успешной проверки откроется защищённая часть desengine со списком задач и API лаборатории.
              </p>
            </div>

            {accessState === "expired" && (
              <p className="mt-4 tool-notice-warning">
                Предыдущий допуск истёк. Повторно введите email из allowlist, чтобы открыть защищённую часть лаборатории.
              </p>
            )}

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

              {error && (
                <p className="tool-notice-error">{error}</p>
              )}

              {!configured && (
                <p className="tool-notice-warning">
                  Проверка доступа пока не настроена. Сначала администратор должен задать
                  `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` в `config.txt`.
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

            <div className="mt-4 grid gap-3 text-black/70 md:grid-cols-3">
              <div className="tool-subcard">
                После допуска приложение возвращает пользователя на целевой path без `?next=...`.
              </div>
              <div className="tool-subcard">
                Допуск действует только для текущего открытия приложения и в любом случае истекает через 24 часа после проверки.
              </div>
              <div className="tool-subcard">
                Проверка допуска не подтверждает владение почтовым ящиком.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export { AccessGate }
