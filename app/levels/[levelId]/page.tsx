import { notFound } from "next/navigation"

import { Lab } from "@/components/desengine/Lab"
import { requireAccessOrRedirect } from "@/lib/access-control.server"
import { createLevelsPath } from "@/lib/navigation"
import { getLevelOverview } from "@/lib/server"

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
