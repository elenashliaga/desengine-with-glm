## 1. Контракт

- [x] 1.1 Зафиксировать в OpenSpec правило: access-check только в route entry points

## 2. Реализация

- [x] 2.1 Удалить `requireAccessOrRedirect` из `components/desengine/tasks/TasksPage.tsx`
- [x] 2.2 Проверить, что guard остаётся в `app/tasks/page.tsx`
- [x] 2.3 Закрыть route-level guard для `app/page.tsx`, `/help` и `/playground/**`
- [x] 2.4 Добавить auth-check в приватные API `/api/tasks/**` и `/api/levels/**`

## 3. Проверка

- [x] 3.1 Убедиться, что в `components/**` нет вызовов `requireAccessOrRedirect`
- [x] 3.2 Прогнать адресную проверку линтом по затронутым файлам
