type OnboardingSyncState = "missing" | "unconfirmed" | "synced"

type OnboardingSourceMarker = {
  repoUrl: string
  syncedAt: string
  commitHash: string | null
}

function resolveOnboardingSyncState(params: {
  configuredRepoUrl: string
  marker: OnboardingSourceMarker | null
  layoutOk: boolean
  onboardingExists: boolean
}): OnboardingSyncState {
  if (!params.onboardingExists || !params.layoutOk) {
    return "missing"
  }

  if (!params.marker) {
    return "unconfirmed"
  }

  if (!params.configuredRepoUrl || params.marker.repoUrl !== params.configuredRepoUrl) {
    return "unconfirmed"
  }

  return "synced"
}

export type { OnboardingSourceMarker, OnboardingSyncState }
export { resolveOnboardingSyncState }
