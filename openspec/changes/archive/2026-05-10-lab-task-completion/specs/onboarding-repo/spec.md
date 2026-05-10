## Status

Superseded by `level-result-check`.

## ADDED Requirements

### Requirement: Hidden prompt проверки существует для каждого текущего уровня

Система SHALL подготавливать hidden prompt-файл проверки для каждого текущего onboarding-уровня по пути `onboarding/prompts/levels/<levelId>/check.md`.

До реализации полноценного checking flow содержимое этих файлов SHALL быть русскоязычной заглушкой, которая описывает будущий контракт проверки результата уровня.

#### Scenario: В репозитории добавлен текущий onboarding-уровень
- **WHEN** уровень присутствует в `onboarding/levels/<levelId>/`
- **THEN** для него существует файл `onboarding/prompts/levels/<levelId>/check.md`

#### Scenario: Prompt проверки пока не финализирован
- **WHEN** checking flow ещё не реализован до конца
- **THEN** `check.md` может содержать данные-заглушки
- **AND** эти данные остаются валидным onboarding-артефактом для уровня
