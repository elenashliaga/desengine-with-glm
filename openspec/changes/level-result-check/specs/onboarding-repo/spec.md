## MODIFIED Requirements

### Requirement: В onboarding-репозиторий входят уровни, задачи и didactic-prompts

Система SHALL относить hidden checking prompts уровней к onboarding-репозиторию.

#### Scenario: Система читает checking prompt уровня
- **WHEN** runtime нужен hidden prompt для проверки результата уровня
- **THEN** он рассматривает onboarding-репозиторий как источник этого prompt-файла

### Requirement: Onboarding-контент собирается под единым корнем `/onboarding`

Система SHALL хранить hidden checking prompts уровней под путём `onboarding/prompts/levels/<levelId>/check.md`.

#### Scenario: Автор onboarding-уровня добавляет prompt проверки
- **WHEN** в уровень добавляется hidden checking prompt
- **THEN** он лежит по пути `onboarding/prompts/levels/<levelId>/check.md`

### Requirement: Onboarding-контент хранится в отдельном репозитории

Система SHALL хранить limit-настройку проверок уровня в открытом level config внутри onboarding-репозитория.

#### Scenario: Автор onboarding-уровня задаёт лимит проверок
- **WHEN** он настраивает число допустимых содержательных проверок уровня
- **THEN** он задаёт это через `maxCheckAttempts` в `onboarding/levels/<levelId>/config.json`
