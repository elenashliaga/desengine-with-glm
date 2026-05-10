"use client";

import { MarkdownContent } from "@/components/desengine/MarkdownContent";
import { Button } from "@/components/ui/button";
import { OutRender } from "@/components/desengine/InOut/OutRender/OutRender";
import type { TaskTransition } from "@/lib/types";

type TaskDoneProps = {
  transition: TaskTransition;
  started: boolean;
  pending: boolean;
  onOpenTask: () => void;
  onBackToTaskList: () => void;
};

export function TaskDone({
  transition,
  started,
  pending,
  onOpenTask,
  onBackToTaskList,
}: TaskDoneProps) {
  const previousLevelTaskText = transition.fromTaskTip
    || `В задаче ${transition.taskId} на уровне ${transition.fromLevel.number} удалось закрепить итоговый результат без необходимости перехода дальше.`;

  return (
    <section className="space-y-4 rounded-md border p-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Задача решена целиком
        </p>
        <h1 className="font-semibold">
          {`Задача ${transition.taskId} завершена на уровне ${transition.fromLevel.number}`}
        </h1>
        <p className="text-muted-foreground">
          Последний уровень успешно прошёл содержательную проверку, новых уровней для этой задачи больше нет.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,1fr)]">
        <div className="space-y-4 rounded-md border p-4">
          <div className="space-y-2">
            <p className="font-medium">Что удалось на последнем уровне</p>
            <MarkdownContent content={previousLevelTaskText} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground/80">Общий фокус уровня</p>
              <MarkdownContent
                className="text-sm text-muted-foreground/80"
                content={transition.fromLevel.description}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Итоговый результат задачи</p>
            <OutRender
              task={transition.taskId}
              started={started}
              reloadKey={0}
              startStatus=""
            />
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <p className="font-medium">Что это означает дальше</p>
          <p className="text-muted-foreground whitespace-pre-wrap">
            Эта задача исчерпала свою траекторию по уровням. Можно вернуться к списку задач или открыть лабораторию ещё раз, чтобы посмотреть финальное состояние файлов.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={pending} onClick={onBackToTaskList}>
          Перейти в список задач
        </Button>
        <Button variant="outline" disabled={pending} onClick={onOpenTask}>
          Открыть задачу
        </Button>
      </div>
    </section>
  );
}
