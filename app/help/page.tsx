import Link from "next/link"

import { requireAccessOrRedirect } from "@/lib/auth/server"
import { getLabRootUrl } from "@/lib/lab/navigation"
import { getLevelsRootUrl } from "@/lib/level/navigation"
import { getTasksRootUrl } from "@/lib/task/navigation"
import { getAuthUrl } from "@/lib/auth/navigation"
import { getConfigUrl } from "@/lib/config/navigation"

const helpCards = [
  {
    title: "1. Войти в систему",
    text: "Откройте страницу аутентификации и введите свой email.",
    href: getAuthUrl(),
    label: "Войти в систему",
  },
  {
    title: "2. Решить задачу",
    text: "После входа вы сразу окажетесь в лаборатории. И там увидите список задач. Выбирайте любую задачу и кликайте на неё.",
    href: getLabRootUrl(),
    label: "Перейти в лабораторию",
  },
  {
    title: "3. Узнать больше про задачу",
    text: "Из каталога задач можно перейти на страницу с подробностями по каждой задаче.",
    href: getTasksRootUrl(),
    label: "Открыть каталог задач",
  },
  {
    title: "4. Смотреть уровни",
    text: "У каждого уровня — своё описание и свой набор доступных задач. Можно решать оттуда.",
    href: getLevelsRootUrl(),
    label: "Посмотреть все уровни",
  },
  {
    title: "5. Проверить настройки",
    text: "Если что-то не работает, на странице конфигурации видны сетевые проверки и инструкции для пользователя и администратора.",
    href: getConfigUrl(),
    label: "Dashboard настроек",
  },
]

export default async function HelpPage() {
  await requireAccessOrRedirect("/help")

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
