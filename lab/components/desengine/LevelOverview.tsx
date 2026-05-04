"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LevelOverview as LevelOverviewData } from "@/lib/types";
import { LevelTaskCard } from "./LevelTaskCard";

type LevelOverviewProps = {
  overview: LevelOverviewData;
  pending: boolean;
  onOpenTask: (taskId: string) => void;
  onNavigateLevel: (levelId: string) => void;
};

export function LevelOverview({
  overview,
  pending,
  onOpenTask,
  onNavigateLevel,
}: LevelOverviewProps) {
  return (
    <section className="space-y-6 rounded-md border p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Экран уровня</p>
          <h1 className="text-2xl font-semibold">{overview.level.title}</h1>
          <p className="text-sm text-muted-foreground">
            Уровень {overview.level.number}. Лимит промптов на задачу: {overview.level.maxPromptsPerTask}.
          </p>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {overview.level.description}
          </p>
          <Link className="inline-block text-sm underline underline-offset-4" href="/lab/levels">
            Открыть все уровни
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!overview.prevLevelId || pending}
            onClick={() => overview.prevLevelId && onNavigateLevel(overview.prevLevelId)}
          >
            Предыдущий уровень
          </Button>
          <Button
            variant="outline"
            disabled={!overview.nextLevelId || pending}
            onClick={() => overview.nextLevelId && onNavigateLevel(overview.nextLevelId)}
          >
            Следующий уровень
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-md border p-4">
          <h2 className="text-lg font-medium">Можно решать сейчас</h2>
          {overview.availableTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">На этом уровне сейчас нет доступных задач.</p>
          ) : (
            <div className="space-y-3">
              {overview.availableTasks.map((task) => (
                <LevelTaskCard
                  key={task.id}
                  task={task}
                  mode="available"
                  pending={pending}
                  onOpenTask={onOpenTask}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-md border p-4">
          <h2 className="text-lg font-medium">Этот уровень уже пройден</h2>
          {overview.passedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока ни одна задача не ушла дальше этого уровня.</p>
          ) : (
            <div className="space-y-3">
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
  );
}
