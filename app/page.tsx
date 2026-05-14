import { RootStatusPage } from "@/components/desengine/platform/RootStatusPage"
import { requireAccessOrRedirect } from "@/lib/access/server"
import { getSystemStatusModel } from "@/lib/config/status"

export default async function Page() {
  await requireAccessOrRedirect("/")

  const status = await getSystemStatusModel()

  return (
    <RootStatusPage
      accessState={status.accessState}
      configured={status.allowlistConfigured}
      statusItems={status.items}
      instructions={status.instructions}
    />
  )
}
