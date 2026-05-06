import Link from "next/link"

import { LevelTaskCard } from "@/components/desengine/LevelTaskCard"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createConfigPath, createHelpPath, createLevelsPath, createTasksPath } from "@/lib/navigation"
import { getAllLevelOverviews } from "@/lib/server"

export default async function LevelsPage() {
  await requireAccessOrRedirect(createLevelsPath())

  const overviews = await getAllLevelOverviews()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl px-6 py-10">
        <section className="w-full rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f6f2ea_52%,#ece6da_100%)] p-6 shadow-[0_20px_80px_rgba(28,24,19,0.08)] md:p-8">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-black/60">
                desengine
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
                  Все уровни
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-black/65 md:text-base">
                  Полный обзор каталога уровней: название, описание и задачи, которые доступны или уже пройдены на каждом уровне.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-black/70">
              <Link className="underline underline-offset-4" href={createTasksPath()}>
                К задачам
              </Link>
              <Link className="underline underline-offset-4" href={createConfigPath()}>
                Конфиг
              </Link>
              <Link className="underline underline-offset-4" href={createHelpPath()}>
                Помощь
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {overviews.map((overview) => (
              <section key={overview.level.id} className="space-y-4 rounded-md border border-black/10 bg-white/70 p-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold">{overview.level.title}</h2>
                    <Link className="text-sm underline underline-offset-4" href={createLevelsPath(overview.level.id)}>
                      Открыть уровень
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Уровень {overview.level.number}. Лимит промптов на задачу: {overview.level.maxPromptsPerTask}.
                  </p>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {overview.level.description}
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="space-y-3 rounded-md border p-4">
                    <h3 className="text-lg font-medium">Можно решать сейчас</h3>
                    {overview.availableTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">На этом уровне сейчас нет доступных задач.</p>
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

                  <section className="space-y-3 rounded-md border p-4">
                    <h3 className="text-lg font-medium">Уровень уже пройден</h3>
                    {overview.passedTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Пока ни одна задача не ушла дальше этого уровня.</p>
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
