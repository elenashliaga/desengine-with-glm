## ADDED Requirements

### Requirement: Route-level access guard не дублируется в компонентном слое

Система SHALL выполнять redirect-проверку доступа (`requireAccessOrRedirect`) только на уровне route entry points и не дублировать её внутри UI-компонентов.

#### Scenario: Защищённая страница открывается через route-файл
- **WHEN** пользователь открывает защищённый маршрут
- **THEN** route entry point проверяет доступ через `requireAccessOrRedirect`
- **AND** при отсутствии доступа выполняется redirect в auth-flow

#### Scenario: UI-компонент рендерится внутри защищённого маршрута
- **WHEN** компонентный слой (`components/**`) рендерится после route-level guard
- **THEN** компонент не содержит собственной redirect-проверки доступа
- **AND** не вызывает `requireAccessOrRedirect` повторно
