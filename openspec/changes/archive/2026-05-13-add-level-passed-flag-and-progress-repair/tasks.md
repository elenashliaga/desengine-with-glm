## 1. Контракт

- [x] 1.1 Добавить delta-spec для `user-progress` с явным признаком прохождения уровня `isPassed`

## 2. Реализация

- [x] 2.1 Расширить task-level schema полем `isPassed`
- [x] 2.2 При успешной проверке уровня выставлять `isPassed=true`
- [x] 2.3 Добавить repair при чтении `user-progress` (нормализация + восстановление по passed check-result)
- [x] 2.4 Проверить восстановление состояния для `dipole-button`, `dipole-checkbox`, `dipole-radio` (уровень 1 пройден, уровень 2 не начат)

## 3. Проверка

- [x] 3.1 Прогнать `npm run test:unit`
- [x] 3.2 Прогнать `npm run test:traceability`
