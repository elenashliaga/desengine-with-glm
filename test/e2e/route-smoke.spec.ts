import { expect, test } from "playwright/test"

import { e2eSmokeRoutes, snapshotUserState, type UserStateSnapshotEntry } from "./fixtures/smoke-fixture"

test.describe.configure({ mode: "serial" })

let initialUserState: UserStateSnapshotEntry[] = []

test.beforeAll(() => {
  initialUserState = snapshotUserState()
})

test.afterAll(() => {
  expect(snapshotUserState()).toEqual(initialUserState)
})

test.describe("route smoke без live credentials", () => {
  for (const route of e2eSmokeRoutes.publicRoutes) {
    test(`публичный маршрут ${route} открывается без допуска`, async ({ page }) => {
      await page.goto(route)

      await expect(page.getByRole("navigation", { name: "Глобальная навигация продукта" })).toBeVisible()
      await expect(page.getByRole("link", { name: "задачи" })).toBeVisible()
      await expect(page.getByRole("link", { name: "уровни" })).toBeVisible()
      await expect(page.getByRole("link", { name: "telegram-бот помощи" })).toBeVisible()
      await expect(page.getByRole("link", { name: "edu@eduhund.com" })).toBeVisible()
    })
  }

  for (const route of e2eSmokeRoutes.protectedRoutes) {
    test(`защищённый маршрут ${route.path} без допуска переводит на /auth`, async ({ page }) => {
      test.skip(Boolean(route.skipReason), route.skipReason)

      await page.goto(route.path)

      await expect(page).toHaveURL(/\/auth$/)
      await expect(page.getByRole("heading", { name: "Допуск в лабораторию" })).toBeVisible()
      await expect(page.getByLabel("Email")).toBeDisabled()
    })
  }
})
