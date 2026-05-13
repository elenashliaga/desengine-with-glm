import Link from "next/link"

import { OnboardingUpdateCard } from "@/components/desengine/platform/OnboardingUpdateCard"
import { SystemStatusPanel } from "@/components/desengine/platform/SystemStatusPanel"
import { createAuthPath, createHelpPath, createTasksPath } from "@/lib/platform/navigation"
import { getSystemStatusModel } from "@/lib/config/system-status.server"

export default async function ConfigPage() {
  const status = await getSystemStatusModel()
  const onboardingStatus = status.items.find((item) => item.id === "onboarding-content")

  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <section className="tool-shell-surface">
          <div className="flex flex-wrap items-center gap-3 border-b border-black/10 pb-5 text-black/60">
            <Link className="tool-link" href={createTasksPath()}>
              К задачам
            </Link>
            <Link className="tool-link" href={createAuthPath()}>
              Страница допуска
            </Link>
            <Link className="tool-link" href={createHelpPath()}>
              Помощь
            </Link>
          </div>

          <div className="mt-6">
            <SystemStatusPanel
              statusItems={status.items}
              instructions={status.instructions}
              title="Конфигурация и статусы подключения"
              description="Здесь собрана текущая диагностика локального конфига, активного LLM-провайдера, allowlist, onboarding-контента и пользовательского допуска."
            />
          </div>

          <OnboardingUpdateCard
            canUpdate={status.onboardingRepoConfigured}
            detail={onboardingStatus?.detail ?? "Статус onboarding-контента пока недоступен."}
            syncState={status.onboardingSyncState}
          />
        </section>
      </div>
    </main>
  )
}
