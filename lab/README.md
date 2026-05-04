# desengine lab

Локальная лаборатория для работы с учебными React-задачами.

## Быстрый старт

1. Создай `lab/.env.local`.
2. Задай переменные окружения:

```bash
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=...
DESENGINE_ALLOWLIST_BASE_URL=...
DESENGINE_ALLOWLIST_SALT=...
```

3. Запусти dev-сервер:

```bash
npm run dev
```

4. Открой [http://localhost:3000](http://localhost:3000).

## Документация по настройке

- OpenAI: `lab/env/openai.md`
- Доступ по email через allowlist: `lab/env/access-control.md`

## Полезные команды

```bash
cd lab
DESENGINE_ALLOWLIST_SALT=... npm run allowlist:marker -- user@example.com
```
