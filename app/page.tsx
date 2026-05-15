import { ConfigScreen } from "@/components/desengine/system/ConfigScreen"
import { requireAccessOrRedirect } from "@/lib/auth/server"
import { getSystemStatusModel } from "@/lib/config/status"

export default async function Page() {
  await requireAccessOrRedirect("/")

  const status = await getSystemStatusModel()

  return (
    <ConfigScreen
      authState={status.authState}
      configured={status.allowlistConfigured}
      resources={status.items}
      instructions={status.instructions}
    />
  )
}
