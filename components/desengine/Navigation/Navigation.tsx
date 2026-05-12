"use client"

import Link from "next/link"

import {
  createAuthPath,
  createConfigPath,
  createHelpPath,
  createLevelsPath,
  createTasksPath,
} from "@/lib/navigation"

const navigationLinks = [
  { href: "/", label: "home" },
  { href: createLevelsPath(), label: "уровни" },
  { href: createTasksPath(), label: "задачи" },
  { href: createAuthPath(), label: "auth" },
  { href: createConfigPath(), label: "config" },
  { href: createHelpPath(), label: "help" },
] as const

const contactLinks = [
  {
    href: "https://t.me/eduhund_bot",
    label: "t.me/eduhund_bot",
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
    <nav aria-label="Глобальная навигация продукта" className="tool-global-nav-bleed">
      <div className="tool-global-nav">
        <div className="tool-global-nav-group">
          {navigationLinks.map((item) => (
            <Link key={item.href} className="tool-global-nav-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="tool-global-nav-group">
          {contactLinks.map((item) => (
            <Link
              key={item.href}
              className="tool-global-nav-link"
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
