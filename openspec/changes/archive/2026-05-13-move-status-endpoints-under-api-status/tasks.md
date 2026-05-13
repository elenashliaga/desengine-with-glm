## 1. OpenSpec контракт

- [x] 1.1 Добавить delta spec для capability `llm` с новыми URL status-эндпойнтов

## 2. Реализация API

- [x] 2.1 Добавить `app/api/status/llm/route.ts`
- [x] 2.2 Добавить `app/api/status/openai/route.ts`
- [x] 2.3 Удалить legacy-маршруты `app/api/llm-status` и `app/api/openai-status` без thin-wrapper

## 3. Проверка

- [x] 3.1 Проверить линтом изменённые route-файлы
- [x] 3.2 Проверить, что в репозитории нет оставшихся обращений к `/api/llm-status` и `/api/openai-status`
