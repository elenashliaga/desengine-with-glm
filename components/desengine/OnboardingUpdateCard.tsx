"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type OnboardingUpdateCardProps = {
  canUpdate: boolean
}

type UpdateState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

export function OnboardingUpdateCard({ canUpdate }: OnboardingUpdateCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<UpdateState>({ kind: "idle" })

  function handleUpdate() {
    startTransition(async () => {
      setState({ kind: "idle" })

      try {
        const response = await fetch("/api/onboarding/update", {
          method: "POST",
        })
        const payload = await response.json().catch(() => null) as
          | { ok?: boolean; error?: string; backupPath?: string | null }
          | null

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Не удалось обновить onboarding-контент.")
        }

        const backupText = payload.backupPath
          ? ` Предыдущая версия сохранена в ${payload.backupPath}.`
          : ""

        setState({
          kind: "success",
          message: `Onboarding-контент обновлён.${backupText}`,
        })
        router.refresh()
      } catch (error) {
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : "Не удалось обновить onboarding-контент.",
        })
      }
    })
  }

  return (
    <section className="mt-6 rounded-[24px] border border-black/10 bg-white/75 p-5 shadow-[0_8px_30px_rgba(20,18,14,0.04)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-black">Обновить onboarding</h2>
          <p className="max-w-2xl text-sm leading-6 text-black/60">
            Эта кнопка вручную заново загружает локальный `/onboarding` из внешнего репозитория,
            указанного в `DESENGINE_ONBOARDING_REPO_URL`.
          </p>
        </div>

        <Button
          className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-black/20"
          disabled={!canUpdate || isPending}
          onClick={handleUpdate}
          size="lg"
        >
          {isPending ? "Обновляем..." : "Обновить onboarding"}
        </Button>
      </div>

      {!canUpdate ? (
        <p className="mt-4 text-sm leading-6 text-amber-700">
          Сначала задайте `DESENGINE_ONBOARDING_REPO_URL` в `config.txt`.
        </p>
      ) : null}

      {state.kind === "success" ? (
        <p className="mt-4 text-sm leading-6 text-emerald-700">{state.message}</p>
      ) : null}

      {state.kind === "error" ? (
        <p className="mt-4 text-sm leading-6 text-red-700">{state.message}</p>
      ) : null}
    </section>
  )
}
