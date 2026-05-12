import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { mkdtemp, rename, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)
const { loadLocalConfig, readLocalConfig, getLocalConfigPath } = require("../lib/local-config.cjs")

const rootDir = process.cwd()
const envPath = getLocalConfigPath(rootDir)
const configPath = path.join(rootDir, "desengine.config.json")
const markerFileName = ".desengine-onboarding-source.json"

function readAppConfig() {
  const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"))
  return {
    onboardingRoot: path.resolve(rootDir, parsed.onboardingRoot ?? "onboarding"),
  }
}

async function pathExists(targetPath) {
  try {
    await fs.promises.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function validateOnboardingLayout(root) {
  const levelsRoot = path.join(root, "levels")
  const tasksRoot = path.join(root, "tasks")
  const promptsRoot = path.join(root, "prompts")
  const requiredDirs = [root, levelsRoot, tasksRoot, promptsRoot, path.join(promptsRoot, "levels")]

  for (const dir of requiredDirs) {
    try {
      await fs.promises.readdir(dir)
    } catch {
      throw new Error(`Не найден обязательный каталог onboarding-контента: ${path.relative(rootDir, dir)}.`)
    }
  }

  const [levelEntries, taskEntries] = await Promise.all([
    fs.promises.readdir(levelsRoot, { withFileTypes: true }),
    fs.promises.readdir(tasksRoot, { withFileTypes: true }),
  ])

  if (!levelEntries.some((entry) => entry.isDirectory())) {
    throw new Error("В onboarding-контенте не найдено ни одного каталога уровня.")
  }

  if (!taskEntries.some((entry) => entry.isDirectory())) {
    throw new Error("В onboarding-контенте не найдено ни одного каталога задачи.")
  }

  const defaultPromptPath = path.join(promptsRoot, "default.md")
  if (!(await pathExists(defaultPromptPath))) {
    throw new Error(`Не найден обязательный файл onboarding-контента: ${path.relative(rootDir, defaultPromptPath)}.`)
  }
}

async function runGit(args, cwd) {
  try {
    return await execFileAsync("git", args, {
      cwd,
      env: process.env,
      maxBuffer: 20 * 1024 * 1024,
    })
  } catch (error) {
    const stderr = String(error?.stderr || "").trim()
    const stdout = String(error?.stdout || "").trim()
    const detail = stderr || stdout || error?.message || "Неизвестная ошибка git"
    throw new Error(`Не удалось выполнить git ${args.join(" ")}: ${detail}`)
  }
}

async function main() {
  loadLocalConfig({ forceReload: true })
  const fileEnv = readLocalConfig(envPath)

  for (const [key, value] of Object.entries(fileEnv)) {
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }

  const repoUrl = process.env.DESENGINE_ONBOARDING_REPO_URL?.trim() ?? ""
  if (!repoUrl) {
    throw new Error("Не задан `DESENGINE_ONBOARDING_REPO_URL` в desengine.config.txt.")
  }

  const appConfig = readAppConfig()
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "desengine-onboarding-repair-"))
  const checkoutDir = path.join(tempRoot, "repo")

  try {
    await runGit(["clone", "--depth", "1", repoUrl, checkoutDir])
    const revision = await runGit(["rev-parse", "HEAD"], checkoutDir)
    const commitHash = revision.stdout.trim() || null

    await validateOnboardingLayout(checkoutDir)
    await writeFile(
      path.join(checkoutDir, markerFileName),
      `${JSON.stringify({ repoUrl, syncedAt: new Date().toISOString(), commitHash }, null, 2)}\n`,
      "utf-8",
    )

    if (await pathExists(appConfig.onboardingRoot)) {
      await rm(appConfig.onboardingRoot, { recursive: true, force: true })
    }
    await rename(checkoutDir, appConfig.onboardingRoot)

    process.stdout.write(
      `${JSON.stringify({ ok: true, repoUrl, commitHash }, null, 2)}\n`,
    )
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}

await main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Не удалось синхронизировать onboarding."}\n`)
  process.exitCode = 1
})
