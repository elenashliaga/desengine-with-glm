"use client";

import { Button } from "@/components/ui/button";
import { OutRender } from "@/components/desengine/InOut/OutRender/OutRender";
import type { TaskTransition } from "@/lib/types";

type TaskLevelTransitionProps = {
  transition: TaskTransition;
  started: boolean;
  pending: boolean;
  onContinue: () => void;
  onBackToLevelList: () => void;
};

export function TaskLevelTransition({
  transition,
  started,
  pending,
  onContinue,
  onBackToLevelList,
}: TaskLevelTransitionProps) {
  const reasonText = "успешная проверка результата уровня"
  const previousLevelTaskText = transition.fromTaskTip
    || `В задаче ${transition.taskId} на уровне ${transition.fromLevel.number} удалось закрепить такой результат: ${transition.fromLevel.description}`
  const nextLevel = transition.toLevel

  if (!nextLevel) {
    return null
  }

  const nextLevelTaskText = transition.toTaskTip
    || `В задаче ${transition.taskId} на уровне ${nextLevel.number} следующий фокус такой: ${nextLevel.description}`

  return (
    <section className="space-y-4 rounded-md border p-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Уровень {transition.fromLevel.number} завершён
        </p>
        <h1 className="font-semibold">
          {`Задача ${transition.taskId} готова к переходу на ${nextLevel.title}`}
        </h1>
        <p className="text-muted-foreground">
          Причина завершения: {reasonText}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,1fr)]">
        <div className="space-y-4 rounded-md border p-4">
          <div className="space-y-2">
            <p className="font-medium">Что удалось на предыдущем уровне</p>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {previousLevelTaskText}
            </p>
            {transition.fromTaskTip ? (
              <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap">
                Общий фокус уровня: {transition.fromLevel.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="font-medium">Актуальный результат задачи</p>
            <OutRender
              task={transition.taskId}
              started={started}
              reloadKey={0}
              startStatus=""
            />
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <p className="font-medium">
            Что хочет следующий уровень
          </p>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {nextLevelTaskText}
          </p>
          {transition.toTaskTip ? (
            <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap">
              Общий фокус уровня: {nextLevel.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={pending} onClick={onContinue}>
          Решать эту же задачу дальше
        </Button>
        <Button variant="outline" disabled={pending} onClick={onBackToLevelList}>
          Перейти в список задач
        </Button>
      </div>
    </section>
  );
}
