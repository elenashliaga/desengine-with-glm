import { requireAccessOrRedirect } from "@/lib/auth/server"
import { getAllLevelOverviews } from "@/lib/system/server"
import { LevelsScreen } from "@/components/desengine/level/LevelsScreen"
import { getLevelsRootUrl } from "@/lib/level/navigation"

export default async function LevelsPage() {
  await requireAccessOrRedirect(getLevelsRootUrl())

  const overviews = await getAllLevelOverviews()

  return (
    <LevelsScreen overviews={overviews} />
  )
}
