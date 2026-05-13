import Link from "next/link"
import { TaskListItem } from "@/lib/task/types";
import { BaseProps } from "../platform/Base";
import { createTaskPath } from "@/lib/platform/navigation"
import { ProgressDots } from "../platform/ProgressDots";

type TaskItemProps = BaseProps & {
    task: TaskListItem
}

type TaskItemListProps = BaseProps & {
  tasks: TaskListItem[]
}

function TaskItem({
    task,
    className="flex w-full gap-1"
  } : TaskItemProps) {
  return (
    <article
      key={task.id}
      className={className}
    >
      <Link
        href={createTaskPath(task.id)}
        className="w-80 shrink-0 items-center font-bold text-black transition-opacity hover:opacity-50"
      >
        {task.id}
      </Link>
      <ProgressDots
        total={task.maxLevel}
        completed={task.progress.currentLevel}
      />
    </article>
  )
}

function TaskItemList({
  tasks,
  className="grid grid-cols-3"
} : TaskItemListProps) {
  return(
    <div className={className}>
      {tasks.map((task) => {
        return (
          <TaskItem
            key={task.id}
            task={task}
          />
        )
      })}
    </div>
  )
}

export { TaskItem, TaskItemList }