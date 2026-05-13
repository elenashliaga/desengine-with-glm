## Context

Текущая конфигурация `vitest.config.ts` запускает unit-проект по шаблону `lib/**/*.test.ts`.
Это смешивает тестовые файлы и runtime-модули в одном каталоге.

## Decision

- Канонический каталог unit-тестов: `test/unit`.
- Все unit `*.test.ts` переносим из `lib/` в `test/unit/`.
- В тестах используем импорты через `@/lib/*`, чтобы путь к исходникам не зависел от расположения тестового файла.
- `vitest.config.ts` для проекта `unit` переключаем на `include: ['test/unit/**/*.test.ts']`.

## Verification

- `npx vitest run --project unit` проходит успешно.
- В `lib/` не остаётся `*.test.ts`.
