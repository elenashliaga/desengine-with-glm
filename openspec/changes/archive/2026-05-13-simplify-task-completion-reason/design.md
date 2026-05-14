## Контекст

Сейчас completion текущего уровня моделируется двумя сигналами одновременно:
- `status: "completed"` в `TaskLevelProgress`
- `completionReason: "check_passed"`

Так как второй сигнал не имеет альтернативных значений, он дублирует первый и усложняет модель.

## Цель дизайна

Свести модель завершения уровня к одному каноническому признаку: `status === "completed"`.

## Решение

1. Схемы и типы task-домена
- Удалить `CompletionReasonSchema` из `lib/task/schema.ts`.
- Удалить `completionReason` из `TaskLevelProgressSchema`.
- Удалить `completionReason` из `TaskProgressSummary` и связанных выводных типов.
- Удалить `TaskTransition.reason`, если он типизирован через `CompletionReasonSchema`, и заменить на безreason-версию перехода.

2. Серверная логика task-levels
- В `lib/task/task-levels.server.ts` убрать тип `CompletionReason` и функции/ветки, где он передаётся как параметр.
- Сохранить текущую бизнес-логику: уровень завершается только после успешной проверки (`passed = true`), но без записи отдельной completion-причины.

3. Представление и summary
- В `lib/task/progress.ts` и `lib/task/task-progress-presentation.ts` убрать обращения к `completionReason`.
- Отображение завершения уровня строится по `status`, `currentLevelStarted`, `checkingState` и лимитам, как и сейчас.

4. Тесты и фикстуры
- Обновить `test/fixtures/task-progress.ts` и unit-тесты task-progress, убрав ожидания/фикстуры по `completionReason`.
- Добавить проверку, что функционально поведение экрана задач не меняется после удаления поля.

## Не-цели

- Не меняем модель причин в `TaskCheckResult.kind`.
- Не меняем LLM/iteration/checking протоколы.
- Не меняем API-контракты, кроме отсутствия `completionReason` внутри task-progress payload.

## Риски и защита

- Риск: случайно затронуть другие reason-поля в проекте.
- Защита: ограничить поиск/рефактор по точным символам `CompletionReason`, `completionReason` и файлам `lib/task/**`, `test/unit/task-progress*`, `test/fixtures/task-progress.ts`.
