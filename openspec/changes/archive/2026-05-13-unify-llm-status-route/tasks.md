## 1. OpenSpec

- [x] 1.1 Добавить delta spec для capability `llm` с единым status URL

## 2. Реализация

- [x] 2.1 Удалить `app/api/status/openai/route.ts`
- [x] 2.2 Убедиться, что `app/api/status/llm/route.ts` остаётся единственным status-эндпойнтом LLM

## 3. Проверка

- [x] 3.1 Прогнать линт для `app/api/status/llm/route.ts`
- [x] 3.2 Проверить, что в репозитории нет runtime-обращений к `/api/status/openai`
