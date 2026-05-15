import Link from "next/link"
import { ProgressDots } from "./ProgressDots";
import { TaskItemProps as TaskCardProps, TaskItemListProps } from "./props";
import { getLabUrl } from "@/lib/lab/navigation";

/** Карточка задачи в разных списках */
function TaskCard({
    task,
    className="flex w-full gap-1"
  } : TaskCardProps) {
  return (
    <article
      key={task.id}
      className={className}
    >
      <Link
        href={getLabUrl(task.id)}
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
          <TaskCard
            key={task.id}
            task={task}
          />
        )
      })}
    </div>
  )
}

export { TaskCard as TaskItem, TaskItemList }