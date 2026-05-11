import { RootStatusPage } from "@/components/desengine/RootStatusPage"
import { getSystemStatusModel } from "@/lib/system-status.server"

export default async function Page() {
  const status = await getSystemStatusModel()

  return (
    <RootStatusPage
      accessState={status.accessState}
      statusItems={status.items}
      instructions={status.instructions}
    />
  )
}
