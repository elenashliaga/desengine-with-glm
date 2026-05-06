import { AccessGate } from "@/components/desengine/AccessGate"
import { HomeTaskList } from "@/components/desengine/HomeTaskList"
import { getSystemStatusModel } from "@/lib/system-status.server"
import { getTaskListItems } from "@/lib/server"

type PageProps = {
  searchParams?: Promise<{
    next?: string | string[]
  }>
}

function getNextPath(nextParam: string | string[] | undefined): string {
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam

  if (!nextPath || !nextPath.startsWith("/")) {
    return "/"
  }

  if (nextPath.startsWith("//")) {
    return "/"
  }

  if (!nextPath.startsWith("/lab") && nextPath !== "/") {
    return "/"
  }

  return nextPath
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  const nextPath = getNextPath(params?.next)
  const status = await getSystemStatusModel()

  if (!status.hasAccess) {
    return (
      <AccessGate
        configured={status.allowlistConfigured}
        nextPath={nextPath}
        statusItems={status.items}
        instructions={status.instructions}
      />
    )
  }

  const tasks = await getTaskListItems()

  return <HomeTaskList initialTasks={tasks} />
}
