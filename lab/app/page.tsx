import { AccessGate } from "@/components/desengine/AccessGate"
import { HomeTaskList } from "@/components/desengine/HomeTaskList"
import { getAccessControlConfig, hasAccessSession } from "@/lib/access-control.server"
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

  if (!nextPath.startsWith("/lab") && !nextPath.startsWith("/pre") && nextPath !== "/") {
    return "/"
  }

  return nextPath
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  const nextPath = getNextPath(params?.next)

  if (!(await hasAccessSession())) {
    const { isConfigured } = getAccessControlConfig()
    return <AccessGate configured={isConfigured} nextPath={nextPath} />
  }

  const tasks = await getTaskListItems()

  return <HomeTaskList initialTasks={tasks} />
}
