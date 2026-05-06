## Status

Superseded by `onboarding-repo`.

## ADDED Requirements

### Requirement: Дидактические промпты итерации приходят из didactics-repo

Система SHALL считать didactics-repo каноническим источником дидактических промптов, используемых при итерациях.

#### Scenario: Система формирует дидактическую часть промпта
- **WHEN** система добавляет дидактический промпт к итерации
- **THEN** она использует didactics-repo как источник этого промпта
