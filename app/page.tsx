import { RootStatusPage } from "@/components/desengine/platform/RootStatusPage"
import { getSystemStatusModel } from "@/lib/config/system-status.server"

export default async function Page() {
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
