## MODIFIED Requirements

### Requirement: Каталог уровня хранит только открытые материалы

Система SHALL использовать `onboarding/levels/<levelId>/` только для открытых level-данных, которые могут быть показаны пользователю или участвуют в открытом контракте уровня.

#### Scenario: Разработчик читает папку уровня
- **WHEN** разработчик открывает `onboarding/levels/<levelId>/`
- **THEN** он находит там открытые файлы вроде `config.json` и `overview.md`
- **AND** не находит hidden prompt-файлы

### Requirement: Описание уровня не дублируется со скрытыми prompt-материалами

Система SHALL держать пользовательское описание уровня отдельно от скрытых level prompts.

#### Scenario: Уровень имеет открытое описание и скрытые подсказки для LLM
- **WHEN** уровень использует и `overview.md`, и level-specific prompts
- **THEN** открытое описание остаётся в `onboarding/levels/<levelId>/overview.md`
- **AND** скрытые prompt-материалы остаются в `onboarding/prompts/levels/<levelId>/`
