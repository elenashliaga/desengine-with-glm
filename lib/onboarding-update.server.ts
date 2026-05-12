import "server-only"

import { execFile } from "node:child_process"
import { access, mkdtemp, rename, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { appConfig } from "@/lib/config.server"
import {
  getConfiguredOnboardingRepoUrl,
  validateOnboardingLayout,
  writeOnboardingSourceMarker,
} from "@/lib/onboarding-status.server"

const execFileAsync = promisify(execFile)

type OnboardingUpdateResult = {
  backupPath: string | null
  commitHash: string | null
  repoUrl: string
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function runGit(args: string[], cwd?: string) {
  try {
    return await execFileAsync("git", args, {
      cwd,
      env: process.env,
      maxBuffer: 1024 * 1024 * 20,
    })
  } catch (error) {
    const stderr = error instanceof Error && "stderr" in error ? String(error.stderr || "").trim() : ""
    const stdout = error instanceof Error && "stdout" in error ? String(error.stdout || "").trim() : ""
    const detail = stderr || stdout || (error instanceof Error ? error.message : "Неизвестная ошибка git")
    throw new Error(`Не удалось выполнить git ${args.join(" ")}: ${detail}`)
  }
}

function buildBackupPath() {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")
  return path.join(process.cwd(), `onboarding.backup-${stamp}`)
}

export async function updateOnboardingFromConfig(): Promise<OnboardingUpdateResult> {
  const repoUrl = getConfiguredOnboardingRepoUrl()
  if (!repoUrl) {
    throw new Error("Не задан `DESENGINE_ONBOARDING_REPO_URL` в desengine.config.txt.")
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "desengine-onboarding-"))
  const checkoutDir = path.join(tempRoot, "repo")
  let backupPath: string | null = null
  let commitHash: string | null = null

  try {
    await runGit(["clone", "--depth", "1", repoUrl, checkoutDir])
    const revisionResult = await runGit(["rev-parse", "HEAD"], checkoutDir)
    commitHash = revisionResult.stdout.trim() || null

    const layoutStatus = await validateOnboardingLayout(checkoutDir)
    if (!layoutStatus.ok) {
      throw new Error(layoutStatus.message)
    }

    await writeOnboardingSourceMarker(checkoutDir, {
      repoUrl,
      syncedAt: new Date().toISOString(),
      commitHash,
    })

    if (await pathExists(appConfig.onboardingRoot)) {
      backupPath = buildBackupPath()
      await rename(appConfig.onboardingRoot, backupPath)
    }

    try {
      await rename(checkoutDir, appConfig.onboardingRoot)
    } catch (error) {
      if (backupPath && !(await pathExists(appConfig.onboardingRoot)) && await pathExists(backupPath)) {
        await rename(backupPath, appConfig.onboardingRoot)
        backupPath = null
      }

      throw error
    }

    return {
      backupPath,
      commitHash,
      repoUrl,
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}
