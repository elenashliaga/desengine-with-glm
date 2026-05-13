## Дизайн

### Модель данных

В `TaskLevelProgress` вводится `isPassed?: boolean` (с обратной совместимостью для старых файлов).

Каноника:
- если `isPassed=true`, уровень считается пройденным;
- для UI/flow это синхронизируется со `status="completed"`.

### Миграция и repair

Repair выполняется в момент чтения `user-progress`:
1. Нормализация существующих уровней:
- `status=completed` -> `isPassed=true`;
- `isPassed=true` -> `status=completed`.
2. Восстановление по check-result:
- если есть `user/check-results/<taskId>.json` с `passed=true` и `kind=passed`,
- соответствующий уровень помечается `completed` + `isPassed=true`,
- `currentLevel` поднимается минимум до `levelNumber + 1` (в пределах max).
3. При наличии изменений repaired-store записывается обратно в `user/user-progress.json`.

### Безопасность

- repair не использует failed/technical check results для «автопрохождения»;
- reset-поток остаётся прежним (прогресс задачи удаляется).
