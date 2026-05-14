import { requireAccessOrRedirect } from "@/lib/access/server"
import { getAllLevelOverviews } from "@/lib/platform/server"
import { LevelsScreen } from "@/components/desengine/level/LevelsScreen"
import { createLevelsPath } from "@/lib/platform/navigation"


export default async function LevelsPage() {
  await requireAccessOrRedirect(createLevelsPath())

  const overviews = await getAllLevelOverviews()

  return (
    <LevelsScreen overviews={overviews} />
  )
}
