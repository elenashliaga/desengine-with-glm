# Ollama — локальная настройка

Этот режим позволяет запускать лабораторию без облачного ключа OpenAI.

## Обязательное

- `DESENGINE_LLM_PROVIDER=ollama` — активирует режим Ollama.
- `DESENGINE_OLLAMA_BASE_URL` — базовый URL Ollama, например `http://127.0.0.1:11434`.
- `DESENGINE_OLLAMA_MODEL` — имя модели, доступной на endpoint.
- `DESENGINE_OLLAMA_TIMEOUT_MS` — таймаут запроса в миллисекундах.

## Как задать

Создай файл `lab/.env.local` (он игнорируется git) и добавь:

```bash
DESENGINE_LLM_PROVIDER=ollama
DESENGINE_OLLAMA_BASE_URL=http://127.0.0.1:11434
DESENGINE_OLLAMA_MODEL=llama3.2-vision
DESENGINE_OLLAMA_TIMEOUT_MS=120000
DESENGINE_INIT_LLM_PROVIDER=ollama
DESENGINE_INIT_OLLAMA_MODEL=llama3.2-vision
DESENGINE_ALLOWLIST_BASE_URL=...
DESENGINE_ALLOWLIST_SALT=...
```

## Опционально для инициирующего запуска уровня

- `DESENGINE_INIT_LLM_PROVIDER` — отдельный провайдер для инициирующего запуска уровня.
- `DESENGINE_INIT_OLLAMA_MODEL` — отдельная модель для инициирующего запуска уровня.

Если `DESENGINE_INIT_*` не заданы, инициирующий запуск использует обычные Ollama-настройки.

## Что проверяет лаборатория

- доступность `Ollama` по сети;
- наличие указанной модели на endpoint;
- корректность формата ответа;
- отдельный таймаут для запросов к локальной модели.

Для доступа по email см. `lab/env/access-control.md`.
