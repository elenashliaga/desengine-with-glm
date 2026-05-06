import Link from "next/link"

import { getAllLevelOverviews } from "@/lib/server"
import { LevelTaskCard } from "@/components/desengine/LevelTaskCard"

export default async function LevelsPage() {
  const overviews = await getAllLevelOverviews()

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Все уровни</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Полный обзор каталога уровней: название, описание и задачи, которые доступны или уже пройдены на каждом уровне.
        </p>
        <Link className="text-sm underline underline-offset-4" href="/lab">
          Вернуться в лабораторию
        </Link>
      </div>

      <div className="space-y-6">
        {overviews.map((overview) => (
          <section key={overview.level.id} className="space-y-4 rounded-md border p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{overview.level.title}</h2>
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
    </main>
  )
}
