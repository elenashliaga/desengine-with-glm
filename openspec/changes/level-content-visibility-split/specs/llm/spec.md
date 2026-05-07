## MODIFIED Requirements

### Requirement: Level-specific prompts читаются из скрытого onboarding prompt-слоя

Система SHALL читать init- и didactic-prompt уровня только из скрытого onboarding prompt-слоя.

#### Scenario: Система выполняет init для уровня
- **WHEN** runtime подбирает init prompt уровня
- **THEN** он читает `onboarding/prompts/levels/<levelId>/init.md`

#### Scenario: Система выполняет didactic prompt lookup для уровня
- **WHEN** runtime подбирает didactic prompt уровня
- **THEN** он читает `onboarding/prompts/levels/<levelId>/didactic.md`

### Requirement: LLM-контур не требует level promptKey

Система SHALL определять level-specific prompts по `levelId` без отдельного `promptKey` в открытом конфиге уровня.

#### Scenario: Runtime знает идентификатор уровня
- **WHEN** системе известен `levelId`
- **THEN** этого достаточно для поиска hidden level prompts
- **AND** дополнительный `promptKey` не требуется
