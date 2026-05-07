## MODIFIED Requirements

### Requirement: Открытый и скрытый контур onboarding-уровня разделены по каталогам

Система SHALL разделять level-owned открытый контент и hidden prompt-контент по разным каталогам onboarding-репозитория.

#### Scenario: Система читает открытые данные уровня
- **WHEN** системе нужны пользовательски видимые материалы уровня
- **THEN** она читает их из `onboarding/levels/<levelId>/`

#### Scenario: Система читает скрытые prompt-данные уровня
- **WHEN** системе нужны hidden level prompts
- **THEN** она читает их только из `onboarding/prompts/levels/<levelId>/`

### Requirement: Папка уровня не хранит hidden prompt-файлы

Система SHALL не хранить hidden prompt-материалы внутри `onboarding/levels/<levelId>/`.

#### Scenario: Команда просматривает содержимое уровня
- **WHEN** разработчик открывает `onboarding/levels/<levelId>/`
- **THEN** он видит только открытые материалы уровня
- **AND** не видит там init- или didactic-prompt файлов

### Requirement: Level prompts определяются по levelId

Система SHALL использовать `levelId` как канонический идентификатор для поиска hidden level prompts.

#### Scenario: Runtime подбирает level-specific prompts
- **WHEN** системе нужен init- или didactic-prompt уровня
- **THEN** она определяет их путь по самому `levelId`
- **AND** не требует отдельного `promptKey` в открытом level-конфиге
