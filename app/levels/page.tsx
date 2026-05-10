import Link from "next/link"

import { MarkdownContent } from "@/components/desengine/MarkdownContent"
import { LevelTaskCard } from "@/components/desengine/LevelTaskCard"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createConfigPath, createHelpPath, createLevelsPath, createTasksPath } from "@/lib/navigation"
import { getAllLevelOverviews } from "@/lib/server"

export default async function LevelsPage() {
  await requireAccessOrRedirect(createLevelsPath())

  const overviews = await getAllLevelOverviews()

  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <section className="tool-shell-surface">
          <div className="tool-shell-header">
            <div className="tool-shell-header-copy">
              <div className="tool-eyebrow">desengine</div>
              <div className="tool-shell-title-group">
                <h1 className="tool-page-title">Все уровни</h1>
                <p className="tool-page-description">
                  Полный обзор каталога уровней: название, описание и задачи, которые доступны или уже пройдены на каждом уровне.
                </p>
              </div>
            </div>

            <div className="tool-link-row">
              <Link className="tool-link" href={createTasksPath()}>
                К задачам
              </Link>
              <Link className="tool-link" href={createConfigPath()}>
                Конфиг
              </Link>
              <Link className="tool-link" href={createHelpPath()}>
                Помощь
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {overviews.map((overview) => (
              <section key={overview.level.id} className="tool-section-card space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold">{overview.level.title}</h2>
                    <Link className="tool-link" href={createLevelsPath(overview.level.id)}>
                      Открыть уровень
                    </Link>
                  </div>
                  <p className="text-muted-foreground">
                    Уровень {overview.level.number}. Лимит промптов на задачу: {overview.level.maxPromptsPerTask}.
                  </p>
                  <MarkdownContent className="max-w-3xl" content={overview.level.description} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="tool-section-subcard">
                    <h3 className="font-medium">Можно решать сейчас</h3>
                    {overview.availableTasks.length === 0 ? (
                      <p className="text-muted-foreground">На этом уровне сейчас нет доступных задач.</p>
                    ) : (
                      <div className="space-y-2">
                        {overview.availableTasks.map((task) => (
                          <LevelTaskCard
                            key={task.id}
                            task={task}
                            mode="available"
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="tool-section-subcard">
                    <h3 className="font-medium">Уровень уже пройден</h3>
                    {overview.passedTasks.length === 0 ? (
                      <p className="text-muted-foreground">Пока ни одна задача не ушла дальше этого уровня.</p>
                    ) : (
                      <div className="space-y-2">
                        {overview.passedTasks.map((task) => (
                          <LevelTaskCard
                            key={task.id}
                            task={task}
                            mode="passed"
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
