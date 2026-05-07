## MODIFIED Requirements

### Requirement: Лаборатория уровня читает task-specific intro из Markdown-файла

Система SHALL читать task-specific пояснение уровня из Markdown-файла задачи, если такой файл существует.

#### Scenario: Система открывает задачу на конкретном уровне
- **WHEN** система показывает лабораторию уровня
- **THEN** она читает task-specific intro из `onboarding/tasks/<taskId>/levels/<levelId>/intro.md`, если файл существует

### Requirement: Task-specific intro хранится вне task config

Система SHALL поддерживать отдельный файловый Markdown-слой для task-level пояснений вместо обязательного хранения таких текстов внутри task config.

#### Scenario: Разработчик просматривает onboarding-задачу
- **WHEN** разработчик открывает `onboarding/tasks/<taskId>/levels/<levelId>/`
- **THEN** он может найти там `intro.md` как отдельный файл пользовательского пояснения
