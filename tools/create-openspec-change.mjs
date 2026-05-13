import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const METADATA_FILE = ".openspec.yaml"
const TASKS_FILE = "tasks.md"
const TEST_CHECKLIST_HEADING = "## Тестовая часть change"
const TEST_CHECKLIST = `${TEST_CHECKLIST_HEADING}

- [ ] Указать затронутые OpenSpec capability/scenarios
- [ ] Выбрать уровень проверки: static/contract, unit, component/browser, integration, e2e smoke или live/provider
- [ ] Добавить или обновить тесты в общем слое тестирования
- [ ] Зафиксировать команду проверки: \`npm run ...\`
- [ ] Описать mock/fixture-данные и live credentials, если они нужны
- [ ] Если покрытие откладывается, добавить запись в \`test/traceability/coverage-plan.json\` с причиной и этапом закрытия
`

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

function ensureTestChecklist(changeDir) {
  const tasksPath = path.join(changeDir, TASKS_FILE)

  if (!fs.existsSync(tasksPath)) {
    return false
  }

  const tasks = fs.readFileSync(tasksPath, "utf8")

  if (tasks.includes(TEST_CHECKLIST_HEADING)) {
    return false
  }

  const normalized = tasks.endsWith("\n") ? tasks : `${tasks}\n`
  fs.writeFileSync(tasksPath, `${normalized}\n${TEST_CHECKLIST}`, "utf8")
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
  const addedTestChecklist = ensureTestChecklist(changeDir)

  if (addedShort) {
    console.log(`Добавлено поле short в ${path.relative(projectRoot, path.join(changeDir, METADATA_FILE))}`)
  }

  if (addedTestChecklist) {
    console.log(`Добавлен тестовый чеклист в ${path.relative(projectRoot, path.join(changeDir, TASKS_FILE))}`)
  }
}

main()
