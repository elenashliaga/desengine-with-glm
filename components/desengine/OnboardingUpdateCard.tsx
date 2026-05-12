"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type OnboardingUpdateCardProps = {
  canUpdate: boolean
  detail: string
  syncState: "missing" | "unconfirmed" | "synced"
}

type UpdateState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

export function OnboardingUpdateCard({ canUpdate, detail, syncState }: OnboardingUpdateCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [updateState, setUpdateState] = useState<UpdateState>({ kind: "idle" })

  function handleUpdate() {
    startTransition(async () => {
      setUpdateState({ kind: "idle" })

      try {
        const response = await fetch("/api/onboarding/update", {
          method: "POST",
        })
        const payload = await response.json().catch(() => null) as
          | { ok?: boolean; error?: string; backupPath?: string | null; commitHash?: string | null }
          | null

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Не удалось обновить onboarding-контент.")
        }

        const backupText = payload.backupPath
          ? ` Предыдущая версия сохранена в ${payload.backupPath}.`
          : ""
        const commitText = payload.commitHash ? ` Коммит: ${payload.commitHash}.` : ""

        setUpdateState({
          kind: "success",
          message: `Onboarding-контент обновлён.${backupText}${commitText}`,
        })
        router.refresh()
      } catch (error) {
        setUpdateState({
          kind: "error",
          message: error instanceof Error ? error.message : "Не удалось обновить onboarding-контент.",
        })
      }
    })
  }

  return (
    <section className="tool-panel mt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="font-semibold text-black">Обновить onboarding</h2>
          <p className="max-w-2xl text-black/60">
            Эта кнопка вручную заново загружает локальный `/onboarding` из внешнего репозитория,
            указанного в `DESENGINE_ONBOARDING_REPO_URL`.
          </p>
          <p className={syncState === "synced" ? "tool-notice-success" : "tool-notice-warning"}>
            {detail}
          </p>
        </div>

        <Button
          className="min-w-[220px]"
          disabled={!canUpdate || isPending}
          onClick={handleUpdate}
          size="lg"
        >
          {isPending ? "Обновляем..." : "Обновить onboarding"}
        </Button>
      </div>

      {!canUpdate ? (
        <p className="tool-notice-warning mt-4">
          Сначала задайте `DESENGINE_ONBOARDING_REPO_URL` в `desengine.config.txt`.
        </p>
      ) : null}

      {updateState.kind === "success" ? (
        <p className="tool-notice-success mt-4">{updateState.message}</p>
      ) : null}

      {updateState.kind === "error" ? (
        <p className="tool-notice-error mt-4">{updateState.message}</p>
      ) : null}
    </section>
  )
}
