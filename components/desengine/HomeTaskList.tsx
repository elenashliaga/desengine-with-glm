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

function createTaskHref(taskId: string) {
  return createTaskPath(taskId)
}

function getIndicatorWidth(task: TaskListItem) {
  if (!task.started) return "0%"

  const ratio = task.progress.currentLevel / task.progress.maxLevel
  return `${Math.max(ratio * 100, 8)}%`
}

function getStatusText(task: TaskListItem) {
  if (!task.started) return "Не начиналась"
  return `Уровень ${task.progress.currentLevel} из ${task.progress.maxLevel}`
}

export function HomeTaskList({ initialTasks }: HomeTaskListProps) {
  const router = useRouter()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  async function handleStart(taskId: string) {
    setError("")
    setPendingTaskId(taskId)

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
      router.refresh()
    } catch {
      setError("Не удалось запустить задачу.")
    } finally {
      setPendingTaskId((current) => (current === taskId ? null : current))
    }
  }

  async function handleReset(taskId: string) {
    setError("")
    setPendingTaskId(taskId)

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
      setPendingTaskId((current) => (current === taskId ? null : current))
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl px-6 py-10">
        <section className="w-full rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f6f2ea_52%,#ece6da_100%)] p-6 shadow-[0_20px_80px_rgba(28,24,19,0.08)] md:p-8">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-black/60">
                desengine
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
                  Стартовая страница задач
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-black/65 md:text-base">
                  Здесь видны все задачи, их текущий уровень и быстрые действия для старта, продолжения и сброса.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black/70">
              <div>Всего задач: {initialTasks.length}</div>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link className="underline underline-offset-4" href={createLevelsPath()}>
                  Уровни
                </Link>
                <Link className="underline underline-offset-4" href={createConfigPath()}>
                  Конфиг
                </Link>
                <Link className="underline underline-offset-4" href={createHelpPath()}>
                  Помощь
                </Link>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            {initialTasks.map((task) => {
              const isPending = pendingTaskId === task.id

              return (
                <article
                  key={task.id}
                  className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4 shadow-[0_10px_30px_rgba(20,18,14,0.04)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={createTaskHref(task.id)}
                        className="inline-flex min-w-0 items-center text-base font-semibold text-black transition-opacity hover:opacity-70"
                      >
                        <span className="truncate">{task.id}</span>
                      </Link>
                      <p className="text-sm text-black/55">{getStatusText(task)}</p>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[34rem] lg:flex-row lg:items-center lg:justify-end">
                      <div className="flex flex-wrap items-center gap-2">
                        {task.started ? (
                          <span className="inline-flex h-7 items-center rounded-full border border-black/10 bg-[#f5efe2] px-3 text-xs font-medium text-black/75">
                            Уровень {task.progress.currentLevel}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => void handleStart(task.id)}
                            className="rounded-full bg-black px-3 text-white hover:bg-black/85"
                          >
                            {isPending ? "Запуск…" : "Начать"}
                          </Button>
                        )}

                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link href={createTaskHref(task.id)}>Продолжить</Link>
                        </Button>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-2 w-full min-w-36 overflow-hidden rounded-full bg-black/10 sm:min-w-48">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#2f2418_0%,#8f6a44_100%)] transition-[width]"
                            style={{ width: getIndicatorWidth(task) }}
                          />
                        </div>
                        <span className="w-14 text-right text-xs text-black/45">
                          {task.started ? `${task.progress.currentLevel}/${task.progress.maxLevel}` : `0/${task.progress.maxLevel}`}
                        </span>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={isPending}>
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
                              onClick={() => void handleReset(task.id)}
                            >
                              Подтвердить сброс
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
