# desengine

Локальная лаборатория для учебных React-задач с браузерным первым запуском и защищённым входом в рабочую часть через allowlist.

## Быстрый старт

1. Установите обычный `Node.js` вместе с `npm`.
2. Пройдите локальную установку по [INSTALL.md](/Users/op/dev/olgapavlova/desengine/INSTALL.md:1).
3. Откройте [http://localhost:3000](http://localhost:3000).

До допуска вы увидите только страницу состояния системы. Список задач и рабочая часть лаборатории откроются после успешной allowlist-проверки по email.

## Что видит пользователь

- Корневой маршрут `/` всегда открывает страницу состояния.
- Если `OPENAI_API_KEY` не задан, пользователь всё равно может открыть оболочку и увидеть диагностику.
- Без `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` лаборатория не выдаёт допуск в защищённую часть.
- Даже при полной LLM-конфигурации пользователь не попадает в задачи без email из allowlist.

## Админские команды

```bash
npm run build
npm run smoke
```

- `npm run build` проверяет production-сборку.
- `npm run smoke` делает базовую preflight-проверку env и build.

## Документация

- Локальная установка: [INSTALL.md](/Users/op/dev/olgapavlova/desengine/INSTALL.md:1)
- Пользовательский и локальный запуск: [lab/README.md](/Users/op/dev/olgapavlova/desengine/lab/README.md:1)
- Настройка OpenAI: [lab/env/openai.md](/Users/op/dev/olgapavlova/desengine/lab/env/openai.md:1)
- Настройка allowlist: [lab/env/access-control.md](/Users/op/dev/olgapavlova/desengine/lab/env/access-control.md:1)
- Platform notes: [docs/platform-notes.md](/Users/op/dev/olgapavlova/desengine/docs/platform-notes.md:1)
