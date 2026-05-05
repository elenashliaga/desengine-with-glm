# desengine lab

Локальная лаборатория для работы с учебными React-задачами.

Для локального запуска нужен нормально установленный `Node.js` вместе с `npm`.

## Быстрый старт

1. Работай из корня репозитория.
2. Пройди шаги из [INSTALL.md](/Users/op/dev/olgapavlova/desengine/INSTALL.md:1).
3. Открой [http://localhost:3000](http://localhost:3000).

До допуска по allowlist приложение показывает только страницу состояния системы. Даже без `OPENAI_API_KEY` оболочка откроется, но LLM-сценарии не будут готовы.

## Пользовательский поток

- Пользователь открывает только браузер.
- На `/` он видит статусы системы и инструкции.
- Список задач открывается только после успешной allowlist-проверки по email.

## Документация по настройке

- Шаблон env: [lab/.env.local.example](/Users/op/dev/olgapavlova/desengine/lab/.env.local.example:1)
- OpenAI: `lab/env/openai.md`
- Доступ по email через allowlist: `lab/env/access-control.md`

## Админские команды

```bash
npm run build
npm run smoke
npm --prefix lab run allowlist:marker -- user@example.com
```
