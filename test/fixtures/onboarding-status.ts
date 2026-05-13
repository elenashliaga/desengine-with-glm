import type { OnboardingSourceMarker } from "../../lib/onboarding/onboarding-status"

const onboardingRepoUrl = "https://example.com/desengine-onboarding.git"

const syncedOnboardingMarker: OnboardingSourceMarker = {
  repoUrl: onboardingRepoUrl,
  syncedAt: "2026-05-13T12:00:00.000Z",
  commitHash: "abc123",
}

const mismatchedOnboardingMarker: OnboardingSourceMarker = {
  repoUrl: "https://example.com/other-onboarding.git",
  syncedAt: "2026-05-13T12:00:00.000Z",
  commitHash: "def456",
}

const missingOnboardingState = {
  configuredRepoUrl: onboardingRepoUrl,
  marker: null,
  layoutOk: false,
  onboardingExists: false,
}

const syncedOnboardingState = {
  configuredRepoUrl: onboardingRepoUrl,
  marker: syncedOnboardingMarker,
  layoutOk: true,
  onboardingExists: true,
}

export {
  mismatchedOnboardingMarker,
  missingOnboardingState,
  onboardingRepoUrl,
  syncedOnboardingMarker,
  syncedOnboardingState,
}
