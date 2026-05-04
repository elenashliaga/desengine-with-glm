const labFiles = [
  {
    key: "picture",
    fileName: "picture.png",
    title: "Картинка",
    edit: false,
  },
  {
    key: "markup",
    fileName: "Component.tsx",
    title: "Структура",
    edit: true,
  },
  {
    key: "styles",
    fileName: "styles.ts",
    title: "Оформление",
    edit: true,
  },
  {
    key: "mock",
    fileName: "mock.ts",
    title: "Примеры",
    edit: true,
  },
  {
    key: "props",
    fileName: "props.ts",
    title: "Параметры",
    edit: true,
  },
  {
    key: "stories",
    fileName: "stories.ts",
    title: "Истории",
    edit: true,
  },
] as const

export { labFiles }