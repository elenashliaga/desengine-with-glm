import fs from "node:fs"
import path from "node:path"

const CHANGES_DIR = path.resolve(process.cwd(), "openspec/changes")

function printUsage() {
  console.error("Использование:")
  console.error("  npm run openspec")
  console.error("  node tools/list-active-openspec-changes.mjs")
}

function listChangeDirs(changesDir) {
  return fs
    .readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => path.join(changesDir, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right)))
}

function readProposal(changeDir) {
  const proposalPath = path.join(changeDir, "proposal.md")

  if (!fs.existsSync(proposalPath)) {
    return null
  }

  return fs.readFileSync(proposalPath, "utf8")
}

function readChangeMetadata(changeDir) {
  const metadataPath = path.join(changeDir, ".openspec.yaml")

  if (!fs.existsSync(metadataPath)) {
    return null
  }

  return fs.readFileSync(metadataPath, "utf8")
}

function isSuspended(proposalText) {
  return /## Status\s+Suspended\./m.test(proposalText)
}

function extractShortSummary(metadataText) {
  if (!metadataText) {
    return null
  }

  const match = metadataText.match(/^short:\s*(.+)\s*$/m)

  if (!match) {
    return null
  }

  return match[1].trim().replace(/^["']|["']$/g, "")
}

function extractWhySummary(proposalText) {
  const match = proposalText.match(/## Why\s+([\s\S]*?)(?:\n## |\n# |$)/)

  if (!match) {
    return null
  }

  const normalizedBody = match[1].trim()
  const paragraphs = normalizedBody
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return null
  }

  const firstParagraph = paragraphs[0]

  if (firstParagraph.startsWith("- ")) {
    return null
  }

  const normalizedParagraph = firstParagraph.replace(/\s+/g, " ").trim()
  const firstSentenceMatch = normalizedParagraph.match(/^(.+?[.!?])(?:\s|$)/)
  const sentence = (firstSentenceMatch?.[1] || normalizedParagraph).trim()
  const compactPart = sentence.split(/: | — |; /, 1)[0]?.trim() || sentence
  const words = compactPart.split(/\s+/).filter(Boolean)

  if (words.length <= 12) {
    return compactPart
  }

  return `${words.slice(0, 12).join(" ")}...`
}

function buildChangeSummary(changeDir) {
  const changeName = path.basename(changeDir)
  const metadataText = readChangeMetadata(changeDir)
  const proposalText = readProposal(changeDir)

  if (!proposalText || isSuspended(proposalText)) {
    return null
  }

  const summary = extractShortSummary(metadataText) || extractWhySummary(proposalText)

  return {
    name: changeName,
    summary: summary || "Нет краткого пояснения в секции Why.",
  }
}

function main() {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    printUsage()
    return
  }

  if (args.length > 0) {
    console.error(`Неизвестные аргументы: ${args.join(", ")}`)
    console.error("")
    printUsage()
    process.exit(1)
  }

  if (!fs.existsSync(CHANGES_DIR)) {
    console.error(`Каталог changes не найден: ${CHANGES_DIR}`)
    process.exit(1)
  }

  const changes = listChangeDirs(CHANGES_DIR)
    .map(buildChangeSummary)
    .filter(Boolean)

  if (changes.length === 0) {
    console.log("Нет актуальных changes.")
    return
  }

  for (const change of changes) {
    console.log(`${change.name} — ${change.summary}`)
  }
}

main()
