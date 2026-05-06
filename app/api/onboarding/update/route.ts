import { updateOnboardingFromConfig } from "@/lib/onboarding-update.server"

export async function POST() {
  try {
    const result = await updateOnboardingFromConfig()

    return Response.json({
      ok: true,
      backupPath: result.backupPath,
      repoUrl: result.repoUrl,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось обновить onboarding-контент.",
      },
      { status: 500 },
    )
  }
}
