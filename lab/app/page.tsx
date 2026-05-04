import { redirect } from "next/navigation"

import { AccessGate } from "@/components/desengine/AccessGate"
import { getAccessControlConfig, hasAccessSession } from "@/lib/access-control.server"

type PageProps = {
  searchParams?: Promise<{
    next?: string | string[]
  }>
}

function getNextPath(nextParam: string | string[] | undefined): string {
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam

  if (!nextPath || !nextPath.startsWith("/")) {
    return "/lab"
  }

  if (nextPath.startsWith("//")) {
    return "/lab"
  }

  if (!nextPath.startsWith("/lab") && !nextPath.startsWith("/pre")) {
    return "/lab"
  }

  return nextPath
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  const nextPath = getNextPath(params?.next)

  if (await hasAccessSession()) {
    redirect(nextPath)
  }

  const { isConfigured } = getAccessControlConfig()

  return <AccessGate configured={isConfigured} nextPath={nextPath} />
}
