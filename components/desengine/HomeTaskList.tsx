"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { createConfigPath, createHelpPath, createLevelsPath, createTaskPath } from "@/lib/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { TaskListItem } from "@/lib/types"

type HomeTaskListProps = {
  initialTasks: TaskListItem[]
}

type PendingAction =
  | { taskId: string; type: "start" }
  | { taskId: string; type: "reset" }

function createTaskHref(taskId: string) {
  return createTaskPath(taskId)
}

function getIndicatorWidth(task: TaskListItem) {
  if (!task.started) return "0%"
  if (task.progress.isCompleted) return "100%"

  const ratio = task.progress.currentLevel / task.progress.maxLevel
  return `${Math.max(ratio * 100, 8)}%`
}

function getStatusText(task: TaskListItem) {
  if (!task.started) return "Не начиналась"
  if (task.progress.currentLevelDisplayStatus === "awaiting_check_retry") {
    return "Ждёт проверки"
  }
  if (task.progress.isCompleted) {
    if (task.progress.completionReason === "check_passed") {
      return "Проверка пройдена, задача завершена"
    }

    return "Задача завершена"
  }
  return `Уровень ${task.progress.currentLevel} из ${task.progress.maxLevel}`
}

function getPromptRemainderText(task: TaskListItem) {
  if (!task.started) {
    return `Уточнений на уровне: ${task.progress.promptsLimit}`
  }

  return `Осталось уточнений на уровне: ${task.progress.promptsRemaining} из ${task.progress.promptsLimit}`
}

function getLevelBadgeText(task: TaskListItem) {
  if (task.progress.isCompleted) {
    return "Завершена"
  }

  if (task.progress.currentLevelDisplayStatus === "awaiting_check_retry") {
    return "Ждёт проверки"
  }

  return `Уровень ${task.progress.currentLevel}`
}

export function HomeTaskList({ initialTasks }: HomeTaskListProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string>("")

  async function handleStart(taskId: string) {
    setError("")
    setPendingAction({ taskId, type: "start" })

    try {
      const response = await fetch(`/api/tasks/${taskId}/start`, {
        method: "POST",
      })
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Не удалось запустить задачу.")
        return
      }

      router.push(createTaskHref(taskId))
    } catch {
      setError("Не удалось запустить задачу.")
    } finally {
      setPendingAction((current) => (
        current?.taskId === taskId && current.type === "start" ? null : current
      ))
    }
  }

  async function handleReset(taskId: string) {
    setError("")
    setPendingAction({ taskId, type: "reset" })

    try {
      const response = await fetch(`/api/tasks/${taskId}/reset`, {
        method: "POST",
      })
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Не удалось сбросить задачу.")
        return
      }

      router.refresh()
    } catch {
      setError("Не удалось сбросить задачу.")
    } finally {
      setPendingAction((current) => (
        current?.taskId === taskId && current.type === "reset" ? null : current
      ))
    }
  }

  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <section className="tool-shell-surface">
          <div className="tool-shell-header">
            <div className="tool-shell-header-copy">
              <div className="tool-eyebrow">desengine</div>
              <div className="tool-shell-title-group">
                <h1 className="tool-page-title">Стартовая страница задач</h1>
                <p className="tool-page-description">
                  Здесь видны все задачи, их текущий уровень и быстрые действия для старта, продолжения и сброса.
                </p>
              </div>
            </div>

            <div className="tool-meta-panel">
              <div>Всего задач: {initialTasks.length}</div>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link className="tool-link" href={createLevelsPath()}>
                  Уровни
                </Link>
                <Link className="tool-link" href={createConfigPath()}>
                  Конфиг
                </Link>
                <Link className="tool-link" href={createHelpPath()}>
                  Помощь
                </Link>
              </div>
            </div>
          </div>

          {error ? (
            <p className="tool-notice-error mt-5">{error}</p>
          ) : null}

          <div className="mt-6 space-y-3">
            {initialTasks.map((task) => {
              const isStartPending = pendingAction?.taskId === task.id && pendingAction.type === "start"
              const isResetPending = pendingAction?.taskId === task.id && pendingAction.type === "reset"
              const isPending = isStartPending || isResetPending

              return (
                <article
                  key={task.id}
                  className="tool-card-compact"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={createTaskHref(task.id)}
                        className="inline-flex min-w-0 items-center font-semibold text-black transition-opacity hover:opacity-70"
                      >
                        <span className="truncate">{task.id}</span>
                      </Link>
                      <p className="text-black/55">{getStatusText(task)}</p>
                      <p className="text-sm text-black/45">{getPromptRemainderText(task)}</p>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[34rem] lg:flex-row lg:items-center lg:justify-end">
                      <div className="flex flex-wrap items-center gap-2">
                        {task.started ? (
                          <span className="inline-flex h-7 items-center rounded-full border border-black/10 bg-[#f5efe2] px-3 font-medium text-black/75">
                            {getLevelBadgeText(task)}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => void handleStart(task.id)}
                          >
                            {isStartPending ? "Запуск…" : "Начать"}
                          </Button>
                        )}

                        {task.started ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => router.push(createTaskHref(task.id))}
                          >
                            Продолжить
                          </Button>
                        ) : null}
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-2 w-full min-w-36 overflow-hidden rounded-full bg-black/10 sm:min-w-48">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#2f2418_0%,#8f6a44_100%)] transition-[width]"
                            style={{ width: getIndicatorWidth(task) }}
                          />
                        </div>
                        <span className="w-14 text-right text-black/45">
                          {task.started ? `${task.progress.currentLevel}/${task.progress.maxLevel}` : `0/${task.progress.maxLevel}`}
                        </span>
                      </div>

                      {task.started ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" disabled={isPending}>
                              Сбросить задачу
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Сбросить задачу?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Будут удалены рабочие файлы и история уточнений. Задача снова станет не начатой.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                disabled={isPending}
                                onClick={() => void handleReset(task.id)}
                              >
                                {isResetPending ? "Сброс…" : "Подтвердить сброс"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
