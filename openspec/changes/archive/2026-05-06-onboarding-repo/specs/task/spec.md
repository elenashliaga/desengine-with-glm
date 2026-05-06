## MODIFIED Requirements

### Requirement: Дидактическое описание задачи приходит из внешнего onboarding-слоя

Система SHALL считать task onboarding-описание, task config и базовые task reference assets частью внешнего onboarding-репозитория.

#### Scenario: Система читает задачу как onboarding-сущность
- **WHEN** системе нужно прочитать onboarding-составляющую задачи
- **THEN** она рассматривает onboarding-репозиторий как канонический источник
