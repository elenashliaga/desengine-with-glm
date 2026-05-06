import Link from "next/link"

import { createAuthPath, createConfigPath, createLevelsPath, createTasksPath } from "@/lib/navigation"

const helpCards = [
  {
    title: "1. Получить допуск",
    text: "Откройте страницу допуска, введите email из allowlist и дождитесь успешной проверки.",
    href: createAuthPath(),
    label: "Открыть /auth",
  },
  {
    title: "2. Выбрать задачу",
    text: "После допуска перейдите в каталог задач и откройте нужную задачу по её каноническому адресу.",
    href: createTasksPath(),
    label: "Открыть /tasks",
  },
  {
    title: "3. Смотреть уровни",
    text: "Если нужно понять progression по лаборатории, используйте обзор всех уровней и экран конкретного уровня.",
    href: createLevelsPath(),
    label: "Открыть /levels",
  },
  {
    title: "4. Проверить окружение",
    text: "Если что-то не работает, на странице конфигурации видны сетевые проверки и инструкции для пользователя и администратора.",
    href: createConfigPath(),
    label: "Открыть /config",
  },
]

export default function HelpPage() {
  return (
    <main className="tool-shell-page">
      <div className="tool-shell-frame">
        <section className="tool-shell-surface">
          <div className="space-y-3 border-b border-black/10 pb-5">
            <div className="tool-eyebrow">desengine help</div>
            <h1 className="tool-page-title">Краткая карта пользовательского контура</h1>
            <p className="tool-page-description">
              Эта страница закрепляет основные entry points продукта и помогает быстро понять, куда идти за задачами,
              уровнями, допуском и диагностикой.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {helpCards.map((card) => (
              <article key={card.href} className="tool-card">
                <h2 className="font-semibold text-black">{card.title}</h2>
                <p className="mt-2 text-black/65">{card.text}</p>
                <Link className="tool-link-inline mt-4" href={card.href}>
                  {card.label}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
