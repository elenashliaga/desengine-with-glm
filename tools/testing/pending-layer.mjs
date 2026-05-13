const LAYERS = {
  traceability: {
    title: "Traceability OpenSpec",
    nextTask: "2. Traceability MVP",
    command: "npm run test:traceability",
  },
  integration: {
    title: "Integration",
    nextTask: "4. Unit и integration покрытие specs",
    command: "npm run test:integration",
  },
  e2e: {
    title: "E2E smoke",
    nextTask: "5. Browser, Storybook и e2e smoke",
    command: "npm run test:e2e",
  },
  live: {
    title: "Provider/live",
    nextTask: "3. Credentials и mock-данные",
    command: "npm run test:live",
  },
  spec: {
    title: "Выборочный запуск по OpenSpec capability",
    nextTask: "2. Traceability MVP",
    command: "npm run test:spec -- <capability>",
  },
}

const layerName = process.argv[2] || "unknown"
const layer = LAYERS[layerName]

if (!layer) {
  console.error(`Неизвестный слой тестирования: ${layerName}`)
  console.error(`Доступные слои: ${Object.keys(LAYERS).join(", ")}`)
  process.exit(1)
}

console.log(`${layer.title}: слой ещё не реализован.`)
console.log(`Команда зарезервирована для change testing-layer и будет наполнена на этапе: ${layer.nextTask}.`)
console.log(`Каноническая команда: ${layer.command}`)
console.log("Сейчас этот placeholder завершается успешно, чтобы первый runnable-слой не блокировал runtime и продуктовые правки.")
