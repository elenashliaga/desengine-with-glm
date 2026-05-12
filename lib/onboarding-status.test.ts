import { describe, expect, it } from "vitest"

import { resolveOnboardingSyncState } from "./onboarding-status"

describe("resolveOnboardingSyncState", () => {
  it("возвращает missing, когда `/onboarding` ещё не существует", () => {
    expect(
      resolveOnboardingSyncState({
        configuredRepoUrl: "https://example.com/onboarding.git",
        marker: null,
        layoutOk: false,
        onboardingExists: false,
      }),
    ).toBe("missing")
  })

  it("возвращает unconfirmed, когда каталог есть, но маркер отсутствует", () => {
    expect(
      resolveOnboardingSyncState({
        configuredRepoUrl: "https://example.com/onboarding.git",
        marker: null,
        layoutOk: true,
        onboardingExists: true,
      }),
    ).toBe("unconfirmed")
  })

  it("возвращает unconfirmed, когда маркер указывает на другой репозиторий", () => {
    expect(
      resolveOnboardingSyncState({
        configuredRepoUrl: "https://example.com/onboarding.git",
        marker: {
          repoUrl: "https://example.com/other.git",
          syncedAt: "2026-05-12T12:00:00.000Z",
          commitHash: "abc123",
        },
        layoutOk: true,
        onboardingExists: true,
      }),
    ).toBe("unconfirmed")
  })

  it("возвращает synced, когда маркер совпадает с конфигом", () => {
    expect(
      resolveOnboardingSyncState({
        configuredRepoUrl: "https://example.com/onboarding.git",
        marker: {
          repoUrl: "https://example.com/onboarding.git",
          syncedAt: "2026-05-12T12:00:00.000Z",
          commitHash: "abc123",
        },
        layoutOk: true,
        onboardingExists: true,
      }),
    ).toBe("synced")
  })
})
