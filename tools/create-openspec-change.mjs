import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const METADATA_FILE = ".openspec.yaml"

function printUsage() {
  console.error("Использование:")
  console.error("  npm run openspec:new -- <change-name>")
  console.error("  npm run openspec:new -- <change-name> --schema spec-driven")
  console.error("  npm run openspec:new -- <change-name> --description \"...\"")
}

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    return { help: true }
  }

  let changeName = null

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--schema" || arg === "--description") {
      index += 1
      continue
    }

    if (arg.startsWith("--schema=") || arg.startsWith("--description=")) {
      continue
    }

    if (arg.startsWith("-")) {
      continue
    }

    if (!changeName) {
      changeName = arg
    }
  }

  if (!changeName) {
    throw new Error("Не удалось определить имя change из аргументов.")
  }

  return { help: false, changeName }
}

function ensureShortField(changeDir) {
  const metadataPath = path.join(changeDir, METADATA_FILE)

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata-файл не найден: ${metadataPath}`)
  }

  const metadata = fs.readFileSync(metadataPath, "utf8")

  if (/^short:\s*/m.test(metadata)) {
    return false
  }

  const normalized = metadata.endsWith("\n") ? metadata : `${metadata}\n`
  fs.writeFileSync(metadataPath, `${normalized}short: ""\n`, "utf8")
  return true
}

function main() {
  let parsedArgs

  try {
    parsedArgs = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    console.error("")
    printUsage()
    process.exit(1)
  }

  if (parsedArgs.help) {
    printUsage()
    return
  }

  const projectRoot = process.cwd()
  const changeDir = path.join(projectRoot, "openspec", "changes", parsedArgs.changeName)
  const result = spawnSync("openspec", ["new", "change", ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: "inherit",
  })

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status)
  }

  if (result.error) {
    throw result.error
  }

  const addedShort = ensureShortField(changeDir)

  if (addedShort) {
    console.log(`Добавлено поле short в ${path.relative(projectRoot, path.join(changeDir, METADATA_FILE))}`)
  }
}

main()
