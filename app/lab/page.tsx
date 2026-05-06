import { redirect } from "next/navigation"

import { createLevelsPath, createTaskNextPath, createTaskPath, createTasksPath } from "@/lib/navigation"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const screenParam = getSearchParam(resolvedSearchParams, "screen")
  const levelIdParam = getSearchParam(resolvedSearchParams, "levelId")
  const taskIdParam = getSearchParam(resolvedSearchParams, "taskId")

  if (screenParam === "task" && taskIdParam) {
    redirect(createTaskPath(taskIdParam))
  }

  if (screenParam === "transition" && taskIdParam) {
    redirect(createTaskNextPath(taskIdParam))
  }

  if (screenParam === "level" && levelIdParam) {
    redirect(createLevelsPath(levelIdParam))
  }

  if (screenParam === "level") {
    redirect(createLevelsPath())
  }

  redirect(createTasksPath())
}
