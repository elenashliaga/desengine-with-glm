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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl px-6 py-10">
        <section className="w-full rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,#fff_0%,#f6f2ea_52%,#ece6da_100%)] p-6 shadow-[0_20px_80px_rgba(28,24,19,0.08)] md:p-8">
          <div className="space-y-3 border-b border-black/10 pb-5">
            <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-black/60">
              desengine help
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
              Краткая карта пользовательского контура
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-black/65 md:text-base">
              Эта страница закрепляет основные entry points продукта и помогает быстро понять, куда идти за задачами,
              уровнями, допуском и диагностикой.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {helpCards.map((card) => (
              <article
                key={card.href}
                className="rounded-[22px] border border-black/10 bg-white/80 p-5 shadow-[0_10px_30px_rgba(20,18,14,0.04)]"
              >
                <h2 className="text-lg font-semibold text-black">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/65">{card.text}</p>
                <Link className="mt-4 inline-flex text-sm font-medium underline underline-offset-4" href={card.href}>
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
