import fs from "node:fs"
import path from "node:path"
import { imageSizeFromFile } from "image-size/fromFile"

const DEFAULT_TASKS_ROOT = "onboarding/tasks"
const DEFAULT_OUTPUT_FILE = "config.json"
const DEFAULT_MAX_LEVEL = 20

function printUsage() {
  console.error("Использование:")
  console.error("  npm run admin:tasks:configs")
  console.error("  npm run admin:tasks:configs -- --tasks-root=tasks")
  console.error("  npm run admin:tasks:configs -- --tasks-root=onboarding/tasks --max-level=20")
}

function parseArgs(argv) {
  const options = {
    tasksRoot: DEFAULT_TASKS_ROOT,
    maxLevel: DEFAULT_MAX_LEVEL,
  }

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true
      continue
    }

    if (arg.startsWith("--tasks-root=")) {
      options.tasksRoot = arg.slice("--tasks-root=".length)
      continue
    }

    if (arg.startsWith("--max-level=")) {
      options.maxLevel = Number(arg.slice("--max-level=".length))
      continue
    }

    throw new Error(`Неизвестный аргумент: ${arg}`)
  }

  if (!Number.isInteger(options.maxLevel) || options.maxLevel <= 0) {
    throw new Error("--max-level должен быть положительным целым числом.")
  }

  return options
}

function resolveTasksRoot(tasksRoot) {
  return path.resolve(process.cwd(), tasksRoot)
}

function listTaskDirs(tasksRoot) {
  return fs
    .readdirSync(tasksRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(tasksRoot, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

async function readPngSize(filePath) {
  const size = await imageSizeFromFile(filePath)

  if (!size.width || !size.height) {
    throw new Error(`Не удалось определить размеры файла ${filePath}`)
  }

  return {
    width: size.width,
    height: size.height,
  }
}

function buildConfig({ base, variants, maxLevel }) {
  return {
    base,
    variants,
    maxLevel,
  }
}

async function generateConfig(taskDir, maxLevel) {
  const basePath = path.join(taskDir, "base.png")
  const variantsPath = path.join(taskDir, "variants.png")
  const outputPath = path.join(taskDir, DEFAULT_OUTPUT_FILE)

  if (!fs.existsSync(basePath)) {
    throw new Error(`Не найден base.png: ${taskDir}`)
  }

  if (!fs.existsSync(variantsPath)) {
    throw new Error(`Не найден variants.png: ${taskDir}`)
  }

  const [base, variants] = await Promise.all([readPngSize(basePath), readPngSize(variantsPath)])
  const config = buildConfig({ base, variants, maxLevel })

  fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, "utf8")

  return outputPath
}

async function main() {
  let options

  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    console.error("")
    printUsage()
    process.exit(1)
  }

  if (options.help) {
    printUsage()
    return
  }

  const tasksRoot = resolveTasksRoot(options.tasksRoot)

  if (!fs.existsSync(tasksRoot)) {
    console.error(`Каталог задач не найден: ${tasksRoot}`)
    process.exit(1)
  }

  const taskDirs = listTaskDirs(tasksRoot)

  if (taskDirs.length === 0) {
    console.error(`В каталоге нет задач: ${tasksRoot}`)
    process.exit(1)
  }

  const generatedFiles = []

  for (const taskDir of taskDirs) {
    const outputPath = await generateConfig(taskDir, options.maxLevel)
    generatedFiles.push(path.relative(process.cwd(), outputPath))
  }

  console.log(`Сгенерировано ${generatedFiles.length} task config:`)
  for (const filePath of generatedFiles) {
    console.log(`- ${filePath}`)
  }
}

await main()
