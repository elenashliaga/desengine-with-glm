"use client";

import { useState } from "react";
import Panel from "./Panel";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

type TaskRunnerProps = {
  initialTask: string;
};

export default function TaskRunner({ initialTask }: TaskRunnerProps) {
  const [task, setTask] = useState(
    initialTask || "Сделай карточку товара. Она принимает props: title, description, price."
  );

  const [status, setStatus] = useState("");

  async function runTask() {
    setStatus("Запуск задачи...");

    const res = await fetch("/api/run-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ task })
    });

    const data = await res.json();

    if (!data.ok) {
      setStatus(data.error || "Ошибка");
      return;
    }

    setStatus("Готово. Обнови страницу, чтобы увидеть новый код и props.");
  }

  return (
    <Panel title="Задача для LLM">
      <div className="space-y-3">
        <Textarea
          value={task}
          onChange={(event) => setTask(event.target.value)}
          rows={6}
          className="font-mono text-sm"
        />

        <div className="flex items-center gap-3">
          <Button onClick={runTask}>Запустить задачу</Button>

          {status && (
            <span className="text-sm text-muted-foreground">
              {status}
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}