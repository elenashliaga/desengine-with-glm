## ADDED Requirements

### Requirement: Прогресс задачи не хранит отдельную completion-причину уровня

Система SHALL определять завершение текущего уровня задачи по статусу уровня (`status = completed`) без дополнительного поля `completionReason` в task-progress.

#### Scenario: Уровень успешно завершён
- **WHEN** содержательная проверка уровня завершилась успешно
- **THEN** система отмечает уровень как `completed`
- **AND** не записывает отдельную completion-причину в progress

#### Scenario: Runtime читает локальный task-progress
- **WHEN** приложение загружает прогресс задачи
- **THEN** модель task-progress не требует поля `completionReason`
- **AND** отображение статуса уровня строится по status/checking-state/лимитам
