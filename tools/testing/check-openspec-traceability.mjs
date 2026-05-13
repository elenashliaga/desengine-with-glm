import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const specsRoot = path.join(projectRoot, "openspec", "specs")
const testsRoot = path.join(projectRoot, "test")
const coveragePlanPath = path.join(testsRoot, "traceability", "coverage-plan.json")

const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:js|jsx|mjs|ts|tsx)$/
const SCENARIO_PATTERN = /^#### Scenario:\s*(.+?)\s*$/gm
const CAPABILITY_PATTERN = /^\s*\/\/\s*@openSpec\s+capability:\s*([a-z0-9-]+)\s*$/i
const SCENARIO_ITEM_PATTERN = /^\s*\/\/\s*@openSpec\s+-\s*"(.+)"\s*$/i

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

function walkFiles(dirPath, predicate, result = []) {
  if (!fs.existsSync(dirPath)) {
    return result
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, result)
      continue
    }

    if (entry.isFile() && predicate(entryPath)) {
      result.push(entryPath)
    }
  }

  return result
}

function readSpecs() {
  const specs = new Map()

  for (const entry of fs.readdirSync(specsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const specPath = path.join(specsRoot, entry.name, "spec.md")

    if (!fs.existsSync(specPath)) {
      continue
    }

    const content = readText(specPath)
    const scenarios = [...content.matchAll(SCENARIO_PATTERN)].map((match) => match[1].trim())
    specs.set(entry.name, {
      path: specPath,
      scenarios: new Set(scenarios),
    })
  }

  return specs
}

function readCoveragePlan() {
  if (!fs.existsSync(coveragePlanPath)) {
    return {}
  }

  const parsed = JSON.parse(readText(coveragePlanPath))
  return parsed.uncoveredCapabilities || {}
}

function parseTestMetadata(filePath) {
  const records = []
  let current = null

  for (const line of readText(filePath).split(/\r?\n/)) {
    const capabilityMatch = line.match(CAPABILITY_PATTERN)

    if (capabilityMatch) {
      current = {
        capability: capabilityMatch[1],
        scenarios: [],
        filePath,
      }
      records.push(current)
      continue
    }

    const scenarioMatch = line.match(SCENARIO_ITEM_PATTERN)

    if (scenarioMatch && current) {
      current.scenarios.push(scenarioMatch[1])
    }
  }

  return records
}

function relative(filePath) {
  return path.relative(projectRoot, filePath)
}

const specs = readSpecs()
const coveragePlan = readCoveragePlan()
const testFiles = walkFiles(testsRoot, (filePath) => TEST_FILE_PATTERN.test(filePath))
const records = testFiles.flatMap(parseTestMetadata)
const coveredScenarios = new Map()
const errors = []

for (const [capability, entry] of Object.entries(coveragePlan)) {
  if (!specs.has(capability)) {
    errors.push(`coverage-plan ссылается на неизвестный capability: ${capability}`)
  }

  for (const field of ["priority", "reason", "targetStage"]) {
    if (!entry[field]) {
      errors.push(`coverage-plan.${capability} не содержит поле ${field}`)
    }
  }
}

for (const record of records) {
  const spec = specs.get(record.capability)

  if (!spec) {
    errors.push(`${relative(record.filePath)} ссылается на неизвестный capability: ${record.capability}`)
    continue
  }

  if (record.scenarios.length === 0) {
    errors.push(`${relative(record.filePath)} (${record.capability}) не содержит @openSpec scenario`)
    continue
  }

  const covered = coveredScenarios.get(record.capability) || new Set()
  coveredScenarios.set(record.capability, covered)

  for (const scenario of record.scenarios) {
    if (!spec.scenarios.has(scenario)) {
      errors.push(`${relative(record.filePath)} (${record.capability}) ссылается на неизвестный scenario: ${scenario}`)
      continue
    }

    covered.add(scenario)
  }
}

const coverageRows = []

for (const [capability, spec] of specs.entries()) {
  const covered = coveredScenarios.get(capability) || new Set()
  const uncoveredCount = spec.scenarios.size - covered.size
  const planned = Boolean(coveragePlan[capability])

  if (uncoveredCount > 0 && !planned) {
    errors.push(
      `${capability}: покрыто ${covered.size}/${spec.scenarios.size}, но capability не внесён в coverage-plan`,
    )
  }

  coverageRows.push({
    capability,
    covered: covered.size,
    total: spec.scenarios.size,
    planned,
  })
}

console.log("OpenSpec traceability report")
console.log(`Specs: ${specs.size}`)
console.log(`Test files with @openSpec metadata: ${new Set(records.map((record) => record.filePath)).size}`)
console.log("")

for (const row of coverageRows.sort((left, right) => left.capability.localeCompare(right.capability))) {
  const planLabel = row.planned ? "coverage-plan" : "ready"
  console.log(`- ${row.capability}: ${row.covered}/${row.total} scenarios (${planLabel})`)
}

if (errors.length > 0) {
  console.error("")
  console.error("Traceability errors:")

  for (const error of errors) {
    console.error(`- ${error}`)
  }

  process.exit(1)
}

console.log("")
console.log("Traceability metadata is valid.")
