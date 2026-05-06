import Link from "next/link"

import { OnboardingUpdateCard } from "@/components/desengine/OnboardingUpdateCard"
import { SystemStatusPanel } from "@/components/desengine/SystemStatusPanel"
import { createAuthPath, createHelpPath, createTasksPath } from "@/lib/navigation"
import { getSystemStatusModel } from "@/lib/system-status.server"

export default async function ConfigPage() {
  const status = await getSystemStatusModel()

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
              description="Здесь собрана текущая диагностика локального конфига, OpenAI API, allowlist, onboarding-контента и пользовательского допуска."
            />
          </div>

          <OnboardingUpdateCard canUpdate={status.onboardingRepoConfigured} />
        </section>
      </div>
    </main>
  )
}
