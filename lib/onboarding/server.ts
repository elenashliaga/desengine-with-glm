import "server-only"

import { access, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { appConfig } from "@/lib/config/server"
import localConfig from "@/lib/config/local-config.cjs"
import {
  resolveOnboardingSyncState,
  type OnboardingSourceMarker,
  type OnboardingSyncState,
} from "@/lib/onboarding/status"

const ONBOARDING_SOURCE_MARKER_FILE = ".desengine-onboarding-source.json"

type OnboardingLayoutStatus =
  | { ok: true }
  | { ok: false; message: string; missingPaths: string[] }

type OnboardingSyncStatus = {
  state: OnboardingSyncState
  tone: "ready" | "warning" | "blocked"
  summary: string
  detail: string
  missingPaths: string[]
  legacyPaths: string[]
  configuredRepoUrl: string
  markerPath: string
  marker: OnboardingSourceMarker | null
}

const legacyOnboardingRoots = [
  "levels",
  "tasks",
  path.join("prompts", "didactic"),
]

async function pathExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

export function getConfiguredOnboardingRepoUrl() {
  localConfig.loadLocalConfig()
  return process.env.DESENGINE_ONBOARDING_REPO_URL?.trim() ?? ""
}

export function getOnboardingSourceMarkerPath(root = appConfig.onboardingRoot) {
  return path.join(root, ONBOARDING_SOURCE_MARKER_FILE)
}

export async function validateOnboardingLayout(root: string): Promise<OnboardingLayoutStatus> {
  const levelsRoot = path.join(root, "levels")
  const tasksRoot = path.join(root, "tasks")
  const promptsRoot = path.join(root, "prompts")
  const requiredDirs = [
    root,
    levelsRoot,
    tasksRoot,
    promptsRoot,
    path.join(promptsRoot, "levels"),
  ]
  const missingPaths: string[] = []

  for (const dir of requiredDirs) {
    try {
      await readdir(dir)
    } catch {
      missingPaths.push(path.relative(process.cwd(), dir) || dir)
    }
  }

  if (missingPaths.length > 0) {
    return {
      ok: false,
      message: `Не найдены обязательные каталоги onboarding-контента: ${missingPaths.join(", ")}.`,
      missingPaths,
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
      missingPaths: ["onboarding/levels/*"],
    }
  }

  if (!taskEntries.some((entry) => entry.isDirectory())) {
    return {
      ok: false,
      message: "В onboarding-контенте не найдено ни одного каталога задачи.",
      missingPaths: ["onboarding/tasks/*"],
    }
  }

  const requiredFiles = [path.join(promptsRoot, "default.md")]

  for (const filePath of requiredFiles) {
    if (!(await pathExists(filePath))) {
      const relativeFilePath = path.relative(process.cwd(), filePath) || filePath
      return {
        ok: false,
        message: `Не найден обязательный файл onboarding-контента: ${relativeFilePath}.`,
        missingPaths: [relativeFilePath],
      }
    }
  }

  return { ok: true }
}

export async function readOnboardingSourceMarker(
  root = appConfig.onboardingRoot,
): Promise<OnboardingSourceMarker | null> {
  const markerPath = getOnboardingSourceMarkerPath(root)

  try {
    const raw = await readFile(markerPath, "utf-8")
    const parsed = JSON.parse(raw) as Partial<OnboardingSourceMarker>

    if (
      typeof parsed.repoUrl !== "string" ||
      typeof parsed.syncedAt !== "string" ||
      (parsed.commitHash !== null && typeof parsed.commitHash !== "string")
    ) {
      return null
    }

    return {
      repoUrl: parsed.repoUrl,
      syncedAt: parsed.syncedAt,
      commitHash: parsed.commitHash ?? null,
    }
  } catch {
    return null
  }
}

export async function writeOnboardingSourceMarker(
  root: string,
  marker: OnboardingSourceMarker,
) {
  const markerPath = getOnboardingSourceMarkerPath(root)
  await writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`, "utf-8")
}

export async function getLegacyOnboardingPaths() {
  const existing: string[] = []

  for (const relativePath of legacyOnboardingRoots) {
    const absolutePath = path.join(process.cwd(), relativePath)

    if (await pathExists(absolutePath)) {
      existing.push(relativePath)
    }
  }

  return existing
}

export async function getOnboardingSyncStatus(): Promise<OnboardingSyncStatus> {
  const configuredRepoUrl = getConfiguredOnboardingRepoUrl()
  const markerPath = getOnboardingSourceMarkerPath()
  const legacyPaths = await getLegacyOnboardingPaths()

  if (!(await pathExists(appConfig.onboardingRoot))) {
    return {
      state: "missing",
      tone: "blocked",
      summary: "Onboarding-контент отсутствует",
      detail: configuredRepoUrl
        ? "Каталог `/onboarding` ещё не был синхронизирован из канонического репозитория."
        : "Каталог `/onboarding` отсутствует, а канонический onboarding-репозиторий ещё не настроен.",
      missingPaths: [path.relative(process.cwd(), appConfig.onboardingRoot) || appConfig.onboardingRoot],
      legacyPaths,
      configuredRepoUrl,
      markerPath,
      marker: null,
    }
  }

  const layoutStatus = await validateOnboardingLayout(appConfig.onboardingRoot)
  if (!layoutStatus.ok) {
    return {
      state: "missing",
      tone: "blocked",
      summary: "Onboarding-контент неполон",
      detail: layoutStatus.message,
      missingPaths: layoutStatus.missingPaths,
      legacyPaths,
      configuredRepoUrl,
      markerPath,
      marker: null,
    }
  }

  const marker = await readOnboardingSourceMarker()
  const state = resolveOnboardingSyncState({
    configuredRepoUrl,
    marker,
    layoutOk: true,
    onboardingExists: true,
  })

  if (state === "unconfirmed" && !marker) {
    return {
      state: "unconfirmed",
      tone: "warning",
      summary: "Источник onboarding-контента не подтверждён",
      detail:
        "Каталог `/onboarding` найден, но для него нет подтверждённого маркера синхронизации. Такой каталог нужно пересинхронизировать из `DESENGINE_ONBOARDING_REPO_URL`.",
      missingPaths: [],
      legacyPaths,
      configuredRepoUrl,
      markerPath,
      marker: null,
    }
  }

  if (state === "unconfirmed" && !configuredRepoUrl) {
    return {
      state: "unconfirmed",
      tone: "warning",
      summary: "Источник onboarding-контента не подтверждён",
      detail:
        "Для локального `/onboarding` найден маркер синхронизации, но в `desengine.config.txt` не задан `DESENGINE_ONBOARDING_REPO_URL`, поэтому канонический источник нельзя подтвердить.",
      missingPaths: [],
      legacyPaths,
      configuredRepoUrl,
      markerPath,
      marker,
    }
  }

  if (state === "unconfirmed" && marker && marker.repoUrl !== configuredRepoUrl) {
    return {
      state: "unconfirmed",
      tone: "warning",
      summary: "Onboarding синхронизирован не из того репозитория",
      detail:
        `Локальный маркер указывает на ${marker.repoUrl}, а ` +
        `в конфиге задан ${configuredRepoUrl}. Нужна явная пересинхронизация.`,
      missingPaths: [],
      legacyPaths,
      configuredRepoUrl,
      markerPath,
      marker,
    }
  }

  const confirmedMarker = marker
  if (!confirmedMarker) {
    return {
      state: "unconfirmed",
      tone: "warning",
      summary: "Источник onboarding-контента не подтверждён",
      detail:
        "Не удалось подтвердить маркер синхронизации `/onboarding`. Выполните повторную синхронизацию из `DESENGINE_ONBOARDING_REPO_URL`.",
      missingPaths: [],
      legacyPaths,
      configuredRepoUrl,
      markerPath,
      marker: null,
    }
  }

  const commitSuffix = confirmedMarker.commitHash ? ` Коммит: ${confirmedMarker.commitHash}.` : ""

  return {
    state,
    tone: "ready",
    summary: "Onboarding синхронизирован из канонического репозитория",
    detail:
      `Источник подтверждён: ${configuredRepoUrl}. ` +
      `Последняя синхронизация: ${confirmedMarker.syncedAt}.${commitSuffix}`,
    missingPaths: [],
    legacyPaths,
    configuredRepoUrl,
    markerPath,
    marker: confirmedMarker,
  }
}

export type {
  OnboardingLayoutStatus,
  OnboardingSyncStatus,
}

export { ONBOARDING_SOURCE_MARKER_FILE }
