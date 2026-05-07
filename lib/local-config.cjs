const fs = require("node:fs")
const path = require("node:path")

const LOCAL_CONFIG_FILENAME = "desengine.config.txt"
const LOCAL_CONFIG_EXAMPLE_FILENAME = "desengine.config-example.txt"
const LEGACY_LOCAL_ENV_FILENAME = ".env.local"

function getLocalConfigPath(cwd = process.cwd()) {
  return path.join(cwd, LOCAL_CONFIG_FILENAME)
}

function getLegacyLocalEnvPath(cwd = process.cwd()) {
  return path.join(cwd, LEGACY_LOCAL_ENV_FILENAME)
}

function getLocalConfigState(cwd = process.cwd()) {
  const configPath = getLocalConfigPath(cwd)
  const legacyEnvPath = getLegacyLocalEnvPath(cwd)

  return {
    configPath,
    legacyEnvPath,
    hasConfig: fs.existsSync(configPath),
    hasLegacyEnv: fs.existsSync(legacyEnvPath),
  }
}

function stripOptionalQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function parseLocalConfig(source) {
  const env = {}

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = stripOptionalQuotes(line.slice(separatorIndex + 1).trim())

    if (!key) {
      continue
    }

    env[key] = value
  }

  return env
}

function readLocalConfig(configPath = getLocalConfigPath()) {
  if (!fs.existsSync(configPath)) {
    return {}
  }

  return parseLocalConfig(fs.readFileSync(configPath, "utf-8"))
}

let loaded = false

function loadLocalConfig(options = {}) {
  if (loaded && !options.forceReload) {
    return {
      exists: fs.existsSync(getLocalConfigPath(options.cwd)),
      loadedKeys: [],
      path: getLocalConfigPath(options.cwd),
    }
  }

  const configPath = getLocalConfigPath(options.cwd)

  if (!fs.existsSync(configPath)) {
    loaded = true
    return {
      exists: false,
      loadedKeys: [],
      path: configPath,
    }
  }

  const fileEnv = readLocalConfig(configPath)
  const loadedKeys = []

  for (const [key, value] of Object.entries(fileEnv)) {
    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue
    }

    process.env[key] = value
    loadedKeys.push(key)
  }

  loaded = true

  return {
    exists: true,
    loadedKeys,
    path: configPath,
  }
}

module.exports = {
  LEGACY_LOCAL_ENV_FILENAME,
  LOCAL_CONFIG_EXAMPLE_FILENAME,
  LOCAL_CONFIG_FILENAME,
  getLegacyLocalEnvPath,
  getLocalConfigState,
  getLocalConfigPath,
  loadLocalConfig,
  parseLocalConfig,
  readLocalConfig,
}
