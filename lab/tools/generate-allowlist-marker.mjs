import crypto from "node:crypto"

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function printUsage() {
  console.error("Использование:")
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
