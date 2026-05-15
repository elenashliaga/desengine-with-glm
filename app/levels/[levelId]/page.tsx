import { notFound } from "next/navigation"

import { Lab } from "@/components/desengine/lab/LabScreen"
import { requireAccessOrRedirect } from "@/lib/auth/server"
import { createLevelsPath } from "@/lib/system/navigation"
import { getLevelOverview } from "@/lib/system/server"

type Params = {
  levelId: string
}

export default async function LevelPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { levelId } = await params
  const canonicalPath = createLevelsPath(levelId)

  await requireAccessOrRedirect(canonicalPath)

  const levelOverview = await getLevelOverview(levelId)

  if (!levelOverview) {
    notFound()
  }

  return (
    <Lab
      initLevelOverview={levelOverview}
      initScreen={{ type: "level" }}
      initTaskItem={null}
      initTaskData={null}
    />
  )
}
