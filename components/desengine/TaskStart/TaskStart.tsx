"use client";

import { Button } from "@/components/ui/button";
import type { TaskListItem } from "@/lib/types";

type TaskStartProps = {
  task: TaskListItem;
  onStarted: () => void;
};

export default function TaskStart({ task, onStarted }: TaskStartProps) {
  return (
    <div className="rounded-md border p-4 space-y-3">
      <p>
        Вы ещё не работали над этой задачей (<code>{task.id}</code>). Начать?
      </p>
      <Button onClick={onStarted}>Да, начать</Button>
    </div>
  );
}

