## MODIFIED Requirements

### Requirement: Открытый config уровня поддерживает URL

Система SHALL позволять уровню хранить дополнительный открытый параметр `url` в `onboarding/levels/<levelId>/config.json`.

#### Scenario: Система читает config уровня с URL
- **WHEN** в `config.json` уровня задано поле `url`
- **THEN** система принимает его как часть открытых метаданных уровня

### Requirement: URL уровня может отсутствовать

Система SHALL считать URL уровня необязательным параметром открытого level-config.

#### Scenario: Уровень не имеет заданного URL
- **WHEN** в `config.json` уровня нет поля `url` или оно пустое
- **THEN** уровень всё равно считается валидным
- **AND** система не падает при чтении level-config
