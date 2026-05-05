import crypto from "node:crypto"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { loadLocalConfig } = require("../lib/local-config.cjs")

loadLocalConfig()

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function printUsage() {
  console.error("Использование:")
  console.error("  node tools/generate-allowlist-marker.mjs user@example.com")
  console.error("  DESENGINE_ALLOWLIST_SALT=... node tools/generate-allowlist-marker.mjs user@example.com")
  console.error("  node tools/generate-allowlist-marker.mjs user@example.com --salt=my-secret-salt")
}

const args = process.argv.slice(2)
const emailArg = args.find((arg) => !arg.startsWith("--")) || ""
const saltArg = args.find((arg) => arg.startsWith("--salt="))
const salt = saltArg ? saltArg.slice("--salt=".length) : process.env.DESENGINE_ALLOWLIST_SALT || ""

const normalizedEmail = normalizeEmail(emailArg)

if (!normalizedEmail || !salt) {
  printUsage()
  process.exit(1)
}

const marker = crypto
  .createHash("sha256")
  .update(`${normalizedEmail}:${salt}`)
  .digest("hex")

console.log(marker)
