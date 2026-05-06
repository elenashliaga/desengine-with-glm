import "server-only"

import { execFile } from "node:child_process"
import { access, mkdtemp, readdir, rename, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { appConfig } from "@/lib/config.server"
import localConfig from "@/lib/local-config.cjs"

const execFileAsync = promisify(execFile)

type OnboardingLayoutStatus =
  | { ok: true }
  | { ok: false; message: string }

type OnboardingUpdateResult = {
  backupPath: string | null
  repoUrl: string
}

function getOnboardingRepoUrl() {
  localConfig.loadLocalConfig()
  return process.env.DESENGINE_ONBOARDING_REPO_URL?.trim() ?? ""
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function validateOnboardingLayout(root: string): Promise<OnboardingLayoutStatus> {
  const levelsRoot = path.join(root, "levels")
  const tasksRoot = path.join(root, "tasks")
  const didacticRoot = path.join(root, "prompts", "didactic")
  const requiredDirs = [
    root,
    levelsRoot,
    tasksRoot,
    didacticRoot,
    path.join(didacticRoot, "levels"),
  ]

  for (const dir of requiredDirs) {
    try {
      await readdir(dir)
    } catch {
      return {
        ok: false,
        message: `Не найден обязательный каталог onboarding-контента: ${path.relative(process.cwd(), dir)}.`,
      }
    }
  }

  const [levelEntries, taskEntries] = await Promise.all([
    readdir(levelsRoot, { withFileTypes: true }),
    readdir(tasksRoot, { withFileTypes: true }),
  ])

  if (!levelEntries.some((entry) => entry.isDirectory())) {
    return {
      ok: false,
      message: "В onboarding-контенте не найдено ни одного каталога уровня.",
    }
  }

  if (!taskEntries.some((entry) => entry.isDirectory())) {
    return {
      ok: false,
      message: "В onboarding-контенте не найдено ни одного каталога задачи.",
    }
  }

  const requiredFiles = [
    path.join(didacticRoot, "start-component.md"),
  ]

  for (const filePath of requiredFiles) {
    if (!(await pathExists(filePath))) {
      return {
        ok: false,
        message: `Не найден обязательный файл onboarding-контента: ${path.relative(process.cwd(), filePath)}.`,
      }
    }
  }

  return { ok: true }
}

async function runGit(args: string[], cwd?: string) {
  try {
    await execFileAsync("git", args, {
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
  const repoUrl = getOnboardingRepoUrl()
  if (!repoUrl) {
    throw new Error("Не задан `DESENGINE_ONBOARDING_REPO_URL` в config.txt.")
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "desengine-onboarding-"))
  const checkoutDir = path.join(tempRoot, "repo")
  let backupPath: string | null = null

  try {
    await runGit(["clone", "--depth", "1", repoUrl, checkoutDir])

    const layoutStatus = await validateOnboardingLayout(checkoutDir)
    if (!layoutStatus.ok) {
      throw new Error(layoutStatus.message)
    }

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
      repoUrl,
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}
