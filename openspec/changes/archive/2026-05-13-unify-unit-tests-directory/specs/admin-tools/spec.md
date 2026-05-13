## ADDED Requirements

### Requirement: Unit-тесты хранятся в едином каталоге `test/unit`

Система SHALL хранить unit-тесты в каталоге `test/unit`, а не рядом с runtime-модулями `lib`.

#### Scenario: Разработчик запускает unit-проект Vitest
- **WHEN** разработчик выполняет `npx vitest run --project unit`
- **THEN** Vitest находит unit-тесты по шаблону `test/unit/**/*.test.ts`
- **AND** тестовые файлы не лежат в `lib/`
