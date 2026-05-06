## MODIFIED Requirements

### Requirement: Уровни и их onboarding-материалы приходят из внешнего onboarding-слоя

Система SHALL считать конфигурацию уровней, их overview и didactic-материалы частью onboarding-репозитория.

#### Scenario: Система читает каталог уровней
- **WHEN** системе нужен каталог уровней и связанные onboarding-материалы
- **THEN** она рассматривает onboarding-репозиторий как канонический источник
