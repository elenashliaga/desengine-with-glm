import {
  getLevelById,
  getLevelOverview,
  getTaskListItemById,
  readTaskData,
} from "@/lib/server"
import { Lab } from "@/components/desengine/Lab"
import type { LabScreenState } from "@/lib/types"

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
    const fromLevelIdParam = getSearchParam(resolvedSearchParams, "fromLevelId")
    const toLevelIdParam = getSearchParam(resolvedSearchParams, "toLevelId")
    const reasonParam = getSearchParam(resolvedSearchParams, "reason")

    const initLevelOverview = await getLevelOverview(levelIdParam)
    const initTaskItem = taskIdParam ? await getTaskListItemById(taskIdParam) : null
    const initTaskData = initTaskItem ? await readTaskData(initTaskItem) : null

    let initScreen: LabScreenState = { type: "level" }

    if (screenParam === "task" && initTaskItem && initTaskData) {
      initScreen = { type: "task" }
    }

    if (screenParam === "transition" && taskIdParam && fromLevelIdParam) {
      const [fromLevel, toLevel] = await Promise.all([
        getLevelById(fromLevelIdParam),
        toLevelIdParam ? getLevelById(toLevelIdParam) : Promise.resolve(null),
      ])

      if (fromLevel && (reasonParam === "manual" || reasonParam === "prompt_limit")) {
        initScreen = {
          type: "transition",
          transition: {
            taskId: taskIdParam,
            fromLevel,
            toLevel,
            reason: reasonParam,
          },
        }
      }
    }

    return (
        <Lab
            initLevelOverview={initLevelOverview}
            initScreen={initScreen}
            initTaskItem={initTaskItem}
            initTaskData={initTaskData}
        />
    );
}
