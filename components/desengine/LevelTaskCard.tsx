"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createTaskPath } from "@/lib/navigation";
import type { LevelOverviewTaskItem } from "@/lib/types";

type LevelTaskCardProps = {
  task: LevelOverviewTaskItem;
  mode: "available" | "passed";
  pending?: boolean;
  onOpenTask?: (taskId: string) => void;
};

function renderTaskMeta(task: LevelOverviewTaskItem) {
  if (task.nextUnlockedLevel !== null) {
    return `Сейчас решается на уровне ${task.nextUnlockedLevel}`
  }

  if (task.progress.isCompleted) {
    return "Задача завершена на своей последней ступени"
  }

  return "Этот уровень уже закрыт"
}

export function LevelTaskCard({
  task,
  mode,
  pending = false,
  onOpenTask,
}: LevelTaskCardProps) {
  return (
    <div className="rounded-md border p-3">
      {mode === "available" ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{task.id}</p>
            <p className="text-muted-foreground">
              Текущий уровень задачи: {task.progress.currentLevel} из {task.maxLevel}
            </p>
          </div>
          {onOpenTask ? (
            <Button disabled={pending} onClick={() => onOpenTask(task.id)}>
              Открыть задачу
            </Button>
          ) : (
            <Link
              className="tool-link"
              href={createTaskPath(task.id)}
            >
              Открыть задачу
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="font-medium">{task.id}</p>
          <p className="text-muted-foreground">
            {renderTaskMeta(task)}
          </p>
        </>
      )}
    </div>
  );
}
