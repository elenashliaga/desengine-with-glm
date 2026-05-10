## MODIFIED Requirements

### Requirement: Onboarding-задача поддерживает открытые level-specific tip-файлы

Система SHALL поддерживать в onboarding-задаче отдельные открытые Markdown-файлы пользовательских пояснений по уровням.

#### Scenario: Команда добавляет tip для уровня задачи
- **WHEN** команде нужно дать task-specific учебное пояснение для уровня
- **THEN** она кладёт его в `onboarding/tasks/<taskId>/levels/<levelId>/tip.md`

#### Scenario: Уровень задачи не имеет tip-файла
- **WHEN** в task-owned каталоге уровня нет `tip.md`
- **THEN** onboarding-задача всё равно считается валидной
