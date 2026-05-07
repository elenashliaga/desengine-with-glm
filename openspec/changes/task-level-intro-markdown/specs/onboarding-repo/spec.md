## MODIFIED Requirements

### Requirement: Onboarding-задача поддерживает открытые level-specific intro-файлы

Система SHALL поддерживать в onboarding-задаче отдельные открытые Markdown-файлы пользовательских пояснений по уровням.

#### Scenario: Команда добавляет intro для уровня задачи
- **WHEN** команде нужно дать task-specific учебное пояснение для уровня
- **THEN** она кладёт его в `onboarding/tasks/<taskId>/levels/<levelId>/intro.md`

#### Scenario: Уровень задачи не имеет intro-файла
- **WHEN** в task-owned каталоге уровня нет `intro.md`
- **THEN** onboarding-задача всё равно считается валидной
