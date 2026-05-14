"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import type { TaskListItem } from "@/lib/platform/types"

import { TaskItemList } from "./TaskItem"

type TasksScreenProps = {
  tasks: TaskListItem[]
}

type PendingAction = { taskId: string; type: "reset" }

export function TasksScreen({ tasks }: TasksScreenProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string>("")

  return (
    <main className="px-5 py-5">
      <h1 className="text-8xl py-2">Задачи</h1>
      <h2 className="text-6xl py-2">Всего задач: {tasks.length}</h2>
 
      {error ? (
        <p className="tool-notice-error mt-5">{error}</p>
      ) : null}

      <TaskItemList
        tasks={tasks} 
        className="grid grid-cols-3 py-2 px-1"
      />
    </main>
  )
}
