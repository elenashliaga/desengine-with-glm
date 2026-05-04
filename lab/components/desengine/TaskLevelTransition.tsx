"use client";

import { Button } from "@/components/ui/button";
import type { TaskTransition } from "@/lib/types";

type TaskLevelTransitionProps = {
  transition: TaskTransition;
  pending: boolean;
  onContinue: () => void;
  onBackToLevelList: () => void;
};

export function TaskLevelTransition({
  transition,
  pending,
  onContinue,
  onBackToLevelList,
}: TaskLevelTransitionProps) {
  const hasNextLevel = Boolean(transition.toLevel)

  return (
    <section className="space-y-4 rounded-md border p-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Уровень {transition.fromLevel.number} завершён
        </p>
        <h1 className="text-2xl font-semibold">
          {hasNextLevel
            ? `Задача ${transition.taskId} готова к переходу на ${transition.toLevel?.title}`
            : `Задача ${transition.taskId} завершена на последнем уровне`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Причина завершения: {transition.reason === "manual" ? "пользователь завершил уровень" : "исчерпан лимит промптов"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {hasNextLevel ? (
          <Button disabled={pending} onClick={onContinue}>
            Решать эту же задачу дальше
          </Button>
        ) : null}
        <Button variant="outline" disabled={pending} onClick={onBackToLevelList}>
          Перейти в список задач
        </Button>
      </div>
    </section>
  );
}
