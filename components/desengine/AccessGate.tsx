"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTasksPath } from "@/lib/navigation"
import { SystemStatusPanel, type Instruction, type StatusItem } from "@/components/desengine/SystemStatusPanel"

type AccessGateProps = {
  configured: boolean
  statusItems: StatusItem[]
  instructions: Instruction[]
}

function AccessGate({ configured, statusItems, instructions }: AccessGateProps) {
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <section className="grid w-full gap-8 rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f4f1ea_48%,#ece6da_100%)] p-8 shadow-[0_20px_80px_rgba(28,24,19,0.08)] xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div>
            <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-black/60">
              desengine lab
            </div>

            <div className="mt-7">
              <SystemStatusPanel
                statusItems={statusItems}
                instructions={instructions}
                title="Страница допуска показывает, что уже готово для запуска лаборатории, а что ещё нужно настроить."
                description="До допуска здесь доступны только диагностика и инструкция. Список задач и рабочая часть лаборатории откроются только после успешной allowlist-проверки по email."
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(20,18,14,0.08)]">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-black">Допуск в лабораторию</h2>
              <p className="text-sm leading-6 text-black/60">
                После успешной проверки откроется защищённая часть desengine со списком задач и API лаборатории.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-black/75">
                Email
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPending || !configured}
                  className="h-11 rounded-xl border-black/10 bg-[#f7f4ee] px-3 text-sm text-black"
                />
              </label>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {!configured && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Проверка доступа пока не настроена. Сначала администратор должен задать
                  `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` в `config.txt`.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isPending || !configured}
                className="h-11 w-full rounded-xl bg-black text-sm text-white hover:bg-black/85"
              >
                {isPending ? "Проверяем доступ…" : "Открыть защищённую лабораторию"}
              </Button>
            </form>

            <div className="mt-4 grid gap-3 text-sm text-black/70 md:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                После допуска приложение возвращает пользователя на целевой path без `?next=...`.
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                Допуск действует только для текущего открытия приложения.
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
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
