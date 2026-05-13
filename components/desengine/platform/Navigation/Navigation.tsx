"use client"

import Link from "next/link"

import {
  createAuthPath,
  createConfigPath,
  createHelpPath,
  createLevelsPath,
  createTasksPath,
} from "@/lib/platform/navigation"

const navigationLinks = [
  { href: "/", label: "desengine" },
  { href: createLevelsPath(), label: "уровни" },
  { href: createTasksPath(), label: "задачи" },
  { href: createConfigPath(), label: "настройки" },
  { href: createHelpPath(), label: "справка" },
] as const

const contactLinks = [
  {
    href: "https://t.me/eduhund_bot",
    label: "telegram-бот помощи",
    external: true,
  },
  {
    href: "mailto:edu@eduhund.com",
    label: "edu@eduhund.com",
    external: false,
  },
] as const

function Navigation() {
  return (
    <nav aria-label="Глобальная навигация продукта" className="flex bg-black py-1">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-wrap items-center">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              className="text-white px-5"
              href={item.href}>
              {item.label}
            </Link> 
          ))}
        </div>

        <div className="flex flex-wrap items-center">
          {contactLinks.map((item) => (
            <Link
              key={item.href}
              className="text-cyan-100 px-5"
              href={item.href}
              rel={item.external ? "noreferrer" : undefined}
              target={item.external ? "_blank" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export { Navigation }
