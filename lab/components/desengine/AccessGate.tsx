"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AccessGateProps = {
  configured: boolean
  nextPath: string
}

function AccessGate({ configured, nextPath }: AccessGateProps) {
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
        | { ok?: boolean; error?: string }
        | null

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Не удалось проверить доступ.")
        return
      }

      router.push(nextPath || "/lab")
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
        <section className="grid w-full gap-10 rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f4f1ea_48%,#ece6da_100%)] p-8 shadow-[0_20px_80px_rgba(28,24,19,0.08)] md:grid-cols-[1.25fr_0.95fr] md:p-12">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-black/60">
              desengine lab
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-black md:text-5xl">
                Доступ к лаборатории открывается только по email из allowlist.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-black/65 md:text-base">
                Введите email, и приложение локально проверит наличие соответствующего маркера
                в удалённом статическом allowlist-хранилище.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-black/70">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                Допуск действует только для текущего открытия приложения.
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                Повторное открытие потребует заново ввести email.
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                Проверка допуска не подтверждает владение почтовым ящиком.
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(20,18,14,0.08)]">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-black">Проверка доступа</h2>
              <p className="text-sm leading-6 text-black/60">
                После успешной проверки откроется лаборатория и её API.
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
                  Проверка доступа пока не настроена. Задайте `DESENGINE_ALLOWLIST_BASE_URL` и
                  `DESENGINE_ALLOWLIST_SALT` в `lab/.env.local`.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isPending || !configured}
                className="h-11 w-full rounded-xl bg-black text-sm text-white hover:bg-black/85"
              >
                {isPending ? "Проверяем доступ…" : "Открыть лабораторию"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export { AccessGate }
