import fs from "node:fs"
import path from "node:path"

const DEFAULT_VARIANTS_ROOT = "incoming/variants"
const DEFAULT_BASE_ROOT = "incoming/base"
const DEFAULT_OUTPUT_ROOT = "onboarding/tasks"

function printUsage() {
  console.error("Использование:")
  console.error("  npm run admin:tasks:import -- --variants-root=incoming/variants --base-root=incoming/base")
  console.error("  npm run admin:tasks:import -- --variants-root=/abs/path/variants --base-root=/abs/path/base --output-root=onboarding/tasks")
}

function parseArgs(argv) {
  const options = {
    variantsRoot: DEFAULT_VARIANTS_ROOT,
    baseRoot: DEFAULT_BASE_ROOT,
    outputRoot: DEFAULT_OUTPUT_ROOT,
  }

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true
      continue
    }

    if (arg.startsWith("--variants-root=")) {
      options.variantsRoot = arg.slice("--variants-root=".length)
      continue
    }

    if (arg.startsWith("--base-root=")) {
      options.baseRoot = arg.slice("--base-root=".length)
      continue
    }

    if (arg.startsWith("--output-root=")) {
      options.outputRoot = arg.slice("--output-root=".length)
      continue
    }

    throw new Error(`Неизвестный аргумент: ${arg}`)
  }

  return options
}

function resolveDir(dirPath) {
  return path.resolve(process.cwd(), dirPath)
}

function normalizeTaskName(fileName) {
  const stem = fileName.replace(/\.png$/i, "")

  if (stem.endsWith("-variants")) {
    return stem.slice(0, "-variants".length * -1)
  }

  if (stem.endsWith("-states")) {
    return stem.slice(0, "-states".length * -1)
  }

  return null
}

function listVariantFiles(variantsRoot) {
  return fs
    .readdirSync(variantsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function copyFile(sourcePath, targetPath) {
  fs.copyFileSync(sourcePath, targetPath)
}

function importAssets({ variantsRoot, baseRoot, outputRoot }) {
  const variantsFiles = listVariantFiles(variantsRoot)

  if (variantsFiles.length === 0) {
    throw new Error(`В каталоге нет PNG-файлов: ${variantsRoot}`)
  }

  const imported = []
  const missingBase = []

  for (const fileName of variantsFiles) {
    const taskName = normalizeTaskName(fileName)

    if (!taskName) {
      continue
    }

    const taskDir = path.join(outputRoot, taskName)
    const sourceVariants = path.join(variantsRoot, fileName)
    const sourceBase = path.join(baseRoot, `${taskName}-base.png`)
    const targetVariants = path.join(taskDir, "variants.png")
    const targetBase = path.join(taskDir, "base.png")

    ensureDir(taskDir)
    copyFile(sourceVariants, targetVariants)

    if (fs.existsSync(sourceBase)) {
      copyFile(sourceBase, targetBase)
    } else {
      missingBase.push(path.relative(process.cwd(), sourceBase))
    }

    imported.push(path.relative(process.cwd(), taskDir))
  }

  return { imported, missingBase }
}

function printResult({ imported, missingBase }) {
  console.log(`Подготовлено каталогов задач: ${imported.length}`)
  for (const taskDir of imported) {
    console.log(`- ${taskDir}`)
  }

  if (missingBase.length === 0) {
    return
  }

  console.log("")
  console.log("Не найдены соответствующие base-файлы:")
  for (const filePath of missingBase) {
    console.log(`- ${filePath}`)
  }
}

function main() {
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

  const variantsRoot = resolveDir(options.variantsRoot)
  const baseRoot = resolveDir(options.baseRoot)
  const outputRoot = resolveDir(options.outputRoot)

  if (!fs.existsSync(variantsRoot)) {
    console.error(`Каталог variants не найден: ${variantsRoot}`)
    process.exit(1)
  }

  if (!fs.existsSync(baseRoot)) {
    console.error(`Каталог base не найден: ${baseRoot}`)
    process.exit(1)
  }

  ensureDir(outputRoot)

  const result = importAssets({ variantsRoot, baseRoot, outputRoot })
  printResult(result)
}

main()
