// app/markdown-test/page.tsx

import { MarkdownContent } from "@/components/desengine/system/MarkdownContent"
import { requireAccessOrRedirect } from "@/lib/auth/server"

const markdown = `
# MarkdownContent test

Обычный абзац с **жирным текстом**, *курсивом* и ~~зачёркиванием~~.

## Списки

- Первый пункт
- Второй пункт
- Третий пункт

1. Первый шаг
2. Второй шаг
3. Третий шаг

## Tasks

- [x] mock.ts
- [x] props.ts
- [ ] stories.tsx
- [ ] playground

## Ссылка

[Внутренняя ссылка](/tasks)

[Внешняя ссылка](https://example.com)

## Картинка

![Demo image](demo.png)

## Цитата

> Это пример blockquote внутри MarkdownContent.

## Inline code

Вот пример \`const value = 42\` внутри строки.

## Code block

\`\`\`tsx
function Button() {
  return <button>Save</button>
}
\`\`\`

## Mermaid

\`\`\`mermaid
graph TD
  A[Минимальная вёрстка] --> B[mock.ts]
  B --> C[props.ts]
  C --> D[stories.tsx]
  D --> E[playground]
\`\`\`
`

export default async function Page() {
  await requireAccessOrRedirect("/playground/markdown")

  return (
    <main className="px-10 py-10">
        <MarkdownContent
          content={markdown}
          assetBasePath="/markdown-test"
        />
    </main>
  )
}
