## 1. Контракт

- [x] 1.1 Обновить delta-spec для `user-progress`: убрать requirement на хранение completion-reason в task-progress
- [x] 1.2 Проверить, что в OpenSpec не осталось утверждений, требующих отдельного `completionReason` для завершённого уровня

## 2. Реализация

- [x] 2.1 Удалить `CompletionReasonSchema` и поле `completionReason` из `lib/task/schema.ts`
- [x] 2.2 Упростить типы в `lib/task/types.ts`: убрать все ссылки на completion-reason в `TaskProgressSummary` и transition-типах task-домена
- [x] 2.3 Обновить `lib/task/task-levels.server.ts`: убрать запись/передачу completion-reason, оставить завершение по `status = completed`
- [x] 2.4 Обновить `lib/task/progress.ts` и `lib/task/task-progress-presentation.ts`, убрав зависимость от completion-reason
- [x] 2.5 Проверить `rg -n \"CompletionReason|completionReason\" lib/task test openspec` и убедиться, что в task-контуре не осталось старой модели

## 3. Единый слой тестирования

- [x] 3.1 Обновить фикстуры/юнит-тесты: `test/fixtures/task-progress.ts`, `test/unit/progress.test.ts`, `test/unit/task-progress-presentation.test.ts`
- [x] 3.2 Прогнать `npm run test:unit`
- [x] 3.3 Прогнать `npm run test:traceability` для проверки трассируемости change к тестовому слою
- [x] 3.4 Зафиксировать в change заметку о тестовом контуре и командах запуска (без дополнительных credentials и mock-данных)
