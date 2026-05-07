## MODIFIED Requirements

### Requirement: У задачи может быть отдельное Markdown-пояснение для уровня

Система SHALL поддерживать для задачи отдельное пользовательское пояснение уровня в виде Markdown-файла.

#### Scenario: Для уровня задачи существует tip-файл
- **WHEN** в `onboarding/tasks/<taskId>/levels/<levelId>/tip.md` существует файл
- **THEN** система использует его как task-specific пояснение этого уровня

#### Scenario: Для уровня нет tip-файла
- **WHEN** в `onboarding/tasks/<taskId>/levels/<levelId>/tip.md` файл отсутствует
- **THEN** система не падает
- **AND** показывает пустое task-specific пояснение уровня

### Requirement: Task-level tip относится только к пользовательскому интерфейсу

Система SHALL трактовать task-level `tip.md` как открытый пользовательский материал, а не как часть prompt-контекста.

#### Scenario: Система готовит LLM-контекст уровня
- **WHEN** runtime формирует start- или iterate-prompt
- **THEN** task-level `tip.md` не включается в этот prompt автоматически

#### Scenario: Пользователь открывает задачу на уровне
- **WHEN** система показывает лабораторию уровня
- **THEN** она может показать `tip.md` как пользовательское пояснение уровня
