"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type StatusItem = {
  id: string
  label: string
  tone: "ready" | "warning" | "blocked"
  summary: string
  detail: string
}

type Instruction = {
  id: string
  actor: "Пользователь" | "Администратор"
  text: string
}

type AccessGateProps = {
  configured: boolean
  nextPath: string
  statusItems: StatusItem[]
  instructions: Instruction[]
}

function getStatusClasses(tone: StatusItem["tone"]) {
  if (tone === "ready") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    }
  }

  if (tone === "warning") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      dot: "bg-amber-500",
    }
  }

  return {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  }
}

function AccessGate({ configured, nextPath, statusItems, instructions }: AccessGateProps) {
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

      router.push(nextPath || "/")
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <section className="grid w-full gap-8 rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f4f1ea_48%,#ece6da_100%)] p-8 shadow-[0_20px_80px_rgba(28,24,19,0.08)] xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div className="space-y-7">
            <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-black/60">
              desengine lab
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-black md:text-5xl">
                Страница состояния показывает, что уже готово для запуска лаборатории, а что ещё нужно настроить.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-black/65 md:text-base">
                До допуска здесь доступны только диагностика и инструкция. Список задач и рабочая часть лаборатории
                откроются только после успешной allowlist-проверки по email.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {statusItems.map((item) => {
                const classes = getStatusClasses(item.tone)

                return (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-black/10 bg-white/78 p-4 shadow-[0_8px_30px_rgba(20,18,14,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                          {item.label}
                        </p>
                        <h2 className="mt-2 text-base font-semibold text-black">{item.summary}</h2>
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes.badge}`}>
                        <span className={`size-2 rounded-full ${classes.dot}`} />
                        {item.tone === "ready" ? "Готово" : item.tone === "warning" ? "Проверить" : "Нужно настроить"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-black/60">{item.detail}</p>
                  </article>
                )
              })}
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white/75 p-5">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-black">Что делать дальше</h2>
                <p className="text-sm leading-6 text-black/60">
                  Ниже показаны ближайшие шаги для пользователя и администратора. Пользовательский путь остаётся браузерным,
                  а техническая настройка относится к админскому контуру.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {instructions.map((instruction) => (
                  <div key={instruction.id} className="rounded-2xl border border-black/10 bg-[#f8f4ec] px-4 py-3 text-sm leading-6 text-black/70">
                    <span className="font-semibold text-black">{instruction.actor}:</span> {instruction.text}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-black/70 md:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  Корневой маршрут `/` всегда доступен как точка диагностики.
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  Допуск действует только для текущего открытия приложения.
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  Проверка допуска не подтверждает владение почтовым ящиком.
                </div>
              </div>
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
                  `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` в `lab/.env.local`.
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
          </div>
        </section>
      </div>
    </main>
  )
}

export { AccessGate }
