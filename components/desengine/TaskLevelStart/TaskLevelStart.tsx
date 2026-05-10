"use client"

import { MarkdownContent } from "@/components/desengine/MarkdownContent"
import { Button } from "@/components/ui/button"

import { type TaskLevelStartProps } from "./props"

function TaskLevelStart({
  taskItem,
  taskData,
  startStatus,
  startError,
  onStart,
  onBackToLevelList,
}: TaskLevelStartProps) {
  const { currentLevel, maxLevel } = taskItem.progress
  const isFirstLevel = currentLevel === 1
  const commonExplanation = taskData.labContext?.commonExplanation ?? ""
  const taskTip = taskData.labContext?.taskTip ?? ""

  return (
    <section className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Уровень {currentLevel} из {maxLevel}
        </p>
        <h1 className="text-2xl font-semibold text-black">
          {isFirstLevel && !taskItem.started
            ? `Начать задачу ${taskItem.id}`
            : `Начать уровень ${currentLevel} в задаче ${taskItem.id}`}
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Это одноразовая стартовая страница уровня. После явного старта система выполнит скрытый запуск
          и откроет рабочий экран.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,1fr)]">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <p className="font-medium">Что важно на этом уровне</p>
            <MarkdownContent content={taskTip || "Для этого уровня пока нет отдельного пояснения задачи."} />
          </div>

          <div className="space-y-2">
            <p className="font-medium">Общее пояснение уровня</p>
            <MarkdownContent content={commonExplanation || "Общее пояснение уровня пока не заполнено."} />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <p className="font-medium">Что произойдёт после старта</p>
            <p className="text-muted-foreground">
              Система подготовит файлы именно для этого уровня, сохранит совместимые наработки и затем переведёт
              вас в рабочий экран.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onStart} disabled={startStatus === "starting"}>
              {startStatus === "starting" ? "Запуск уровня…" : "Начать уровень"}
            </Button>
            <Button variant="outline" onClick={onBackToLevelList} disabled={startStatus === "starting"}>
              К списку задач уровня
            </Button>
          </div>

          {startError ? (
            <pre className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
              {startError}
            </pre>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export { TaskLevelStart }
