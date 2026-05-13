"use client";

import Link from "next/link";
import { MarkdownContent } from "@/components/desengine/platform/renders/MarkdownContent";
import { Button } from "@/components/ui/button";
import { createLevelAssetPath, createLevelsPath } from "@/lib/platform/navigation";
import type { LevelOverview as LevelOverviewData } from "@/lib/level/types";
import { LevelTaskCard } from "../level/LevelTaskCard";

type LevelOverviewProps = {
  overview: LevelOverviewData;
  pending: boolean;
  onOpenTask: (taskId: string) => void;
  onNavigateLevel: (levelId: string) => void;
};

function isExternalUrl(url: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)
}

export function LevelOverview({
  overview,
  pending,
  onOpenTask,
  onNavigateLevel,
}: LevelOverviewProps) {
  return (
    <section className="tool-section-card space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground">Экран уровня</p>
          <h1 className="font-semibold">{overview.level.title}</h1>
          <p className="text-muted-foreground">
            Уровень {overview.level.number}. Лимит промптов на задачу: {overview.level.maxPromptsPerTask}.
          </p>
          <MarkdownContent
            assetBasePath={createLevelAssetPath(overview.level.id)}
            className="max-w-3xl"
            content={overview.level.description}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Link className="tool-link-inline" href={createLevelsPath()}>
              Открыть все уровни
            </Link>
            {overview.level.url ? (
              isExternalUrl(overview.level.url) ? (
                <a
                  className="tool-link-inline"
                  href={overview.level.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Дополнительные материалы
                </a>
              ) : (
                <Link className="tool-link-inline" href={overview.level.url}>
                  Дополнительные материалы
                </Link>
              )
            ) : null}
          </div>
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
        <section className="tool-section-subcard">
          <h2 className="font-medium">Можно решать сейчас</h2>
          {overview.availableTasks.length === 0 ? (
            <p className="text-muted-foreground">На этом уровне сейчас нет доступных задач.</p>
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

        <section className="tool-section-subcard">
          <h2 className="font-medium">Этот уровень уже пройден</h2>
          {overview.passedTasks.length === 0 ? (
            <p className="text-muted-foreground">Пока ни одна задача не ушла дальше этого уровня.</p>
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
