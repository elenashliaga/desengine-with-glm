import { OnboardingUpdateCard } from "@/components/desengine/system/OnboardingUpdateCard"
import { getSystemStatusModel } from "@/lib/config/status"
import { SystemStatusPanel } from "@/components/desengine/system/SystemStatusPanel"

export default async function ConfigPage() {
  const resources = await getSystemStatusModel()
  // const onboardingStatus = status.items.find((item) => item.id === "onboarding-content")

  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <SystemStatusPanel resources={resources} />
      </div>
    </main>
  )
}
