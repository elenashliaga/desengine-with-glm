import Link from "next/link"

import { SystemStatusPanel, type Instruction, type StatusItem } from "@/components/desengine/SystemStatusPanel"
import { createAuthPath, createConfigPath, createHelpPath, createTasksPath } from "@/lib/navigation"

type RootStatusPageProps = {
  accessState: "valid" | "missing" | "expired"
  statusItems: StatusItem[]
  instructions: Instruction[]
}

export function RootStatusPage({ accessState, statusItems, instructions }: RootStatusPageProps) {
  const hasAccess = accessState === "valid"

  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <section className="tool-shell-surface">
          <div className="flex flex-wrap items-center gap-3 border-b border-black/10 pb-5 text-black/60">
            <Link className="tool-link" href={createAuthPath()}>
              {hasAccess ? "Проверить допуск" : "Открыть /auth"}
            </Link>
            <Link className="tool-link" href={createConfigPath()}>
              Открыть /config
            </Link>
            <Link className="tool-link" href={createHelpPath()}>
              Открыть /help
            </Link>
            {hasAccess && (
              <Link className="tool-link" href={createTasksPath()}>
                Открыть /tasks
              </Link>
            )}
          </div>

          <div className="mt-6">
            <SystemStatusPanel
              statusItems={statusItems}
              instructions={instructions}
              title="Корень продукта показывает общую страницу состояния системы до входа в защищённую лабораторию."
              description="Здесь доступны только диагностика и следующие шаги. Каталог задач остаётся на `/tasks` и открывается только после успешной allowlist-проверки."
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
