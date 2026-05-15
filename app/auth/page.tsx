import { AuthGate } from "@/components/desengine/auth/AuthGate"
import { redirect } from "next/navigation"

import { getSystemStatusModel } from "@/lib/config/status"
import { getLabRootUrl } from "@/lib/lab/navigation"

export default async function AuthPage() {
  const status = await getSystemStatusModel()

  if (status.hasAccess) {
    redirect(getLabRootUrl())
  }

  return (
    <AuthGate
      authState={status.authState}
      configured={status.allowlistConfigured}
      statusItems={status.items}
      instructions={status.instructions}
    />
  )
}