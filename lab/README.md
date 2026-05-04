# desengine lab

Локальная лаборатория для работы с учебными React-задачами.

## Быстрый старт

1. Создай `lab/.env.local`.
2. Задай переменные окружения для выбранного провайдера:

```bash
DESENGINE_LLM_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=...
DESENGINE_OPENAI_MODEL=...
DESENGINE_INIT_LLM_PROVIDER=openai
DESENGINE_INIT_OPENAI_MODEL=gpt-4o-2024-08-06

# Ollama
DESENGINE_OLLAMA_BASE_URL=http://127.0.0.1:11434
DESENGINE_OLLAMA_MODEL=llama3.2-vision
DESENGINE_OLLAMA_TIMEOUT_MS=120000
DESENGINE_INIT_LLM_PROVIDER=ollama
DESENGINE_INIT_OLLAMA_MODEL=llama3.2-vision

# Общие настройки lab
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
- Ollama: `lab/env/ollama.md`
- Доступ по email через allowlist: `lab/env/access-control.md`

Для инициирующего запуска уровня можно отдельно задать:
- `DESENGINE_INIT_LLM_PROVIDER`
- `DESENGINE_INIT_OPENAI_MODEL`
- `DESENGINE_INIT_OLLAMA_MODEL`

Если они не заданы, лаборатория использует обычные `DESENGINE_LLM_PROVIDER`, `DESENGINE_OPENAI_MODEL` и `DESENGINE_OLLAMA_MODEL`.

## Полезные команды

```bash
cd lab
DESENGINE_ALLOWLIST_SALT=... npm run allowlist:marker -- user@example.com
```
