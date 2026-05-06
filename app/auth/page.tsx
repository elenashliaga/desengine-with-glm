import { AccessGate } from "@/components/desengine/AccessGate"
import { redirect } from "next/navigation"

import { createTasksPath } from "@/lib/navigation"
import { getSystemStatusModel } from "@/lib/system-status.server"

export default async function AuthPage() {
  const status = await getSystemStatusModel()

  if (status.hasAccess) {
    redirect(createTasksPath())
  }

  return (
    <AccessGate
      configured={status.allowlistConfigured}
      statusItems={status.items}
      instructions={status.instructions}
    />
  )
}
