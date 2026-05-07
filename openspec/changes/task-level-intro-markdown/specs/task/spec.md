## MODIFIED Requirements

### Requirement: У задачи может быть отдельное Markdown-пояснение для уровня

Система SHALL поддерживать для задачи отдельное пользовательское пояснение уровня в виде Markdown-файла.

#### Scenario: Для уровня задачи существует intro-файл
- **WHEN** в `onboarding/tasks/<taskId>/levels/<levelId>/intro.md` существует файл
- **THEN** система использует его как task-specific пояснение этого уровня

#### Scenario: Для уровня нет intro-файла
- **WHEN** в `onboarding/tasks/<taskId>/levels/<levelId>/intro.md` файл отсутствует
- **THEN** система не падает
- **AND** показывает пустое task-specific пояснение уровня

### Requirement: Task-level intro относится только к пользовательскому интерфейсу

Система SHALL трактовать task-level `intro.md` как открытый пользовательский материал, а не как часть prompt-контекста.

#### Scenario: Система готовит LLM-контекст уровня
- **WHEN** runtime формирует init- или iterate-prompt
- **THEN** task-level `intro.md` не включается в этот prompt автоматически

#### Scenario: Пользователь открывает задачу на уровне
- **WHEN** система показывает лабораторию уровня
- **THEN** она может показать `intro.md` как пользовательское пояснение уровня
