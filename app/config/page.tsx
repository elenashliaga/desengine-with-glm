import Link from "next/link"

import { OnboardingUpdateCard } from "@/components/desengine/OnboardingUpdateCard"
import { SystemStatusPanel } from "@/components/desengine/SystemStatusPanel"
import { createAuthPath, createHelpPath, createTasksPath } from "@/lib/navigation"
import { getSystemStatusModel } from "@/lib/system-status.server"

export default async function ConfigPage() {
  const status = await getSystemStatusModel()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl px-6 py-10">
        <section className="w-full rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f6f2ea_52%,#ece6da_100%)] p-6 shadow-[0_20px_80px_rgba(28,24,19,0.08)] md:p-8">
          <div className="flex flex-wrap items-center gap-3 border-b border-black/10 pb-5 text-sm text-black/60">
            <Link className="underline underline-offset-4" href={createTasksPath()}>
              К задачам
            </Link>
            <Link className="underline underline-offset-4" href={createAuthPath()}>
              Страница допуска
            </Link>
            <Link className="underline underline-offset-4" href={createHelpPath()}>
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
