## ADDED Requirements

### Requirement: Product-shell имеет единый глобальный Navigation для top-level точек входа

Система SHALL показывать в product-shell интерфейсе единый глобальный `Navigation` сверху страницы как общую точку перехода между каноническими top-level разделами.

#### Scenario: Пользователь открывает product-shell страницу
- **WHEN** пользователь открывает любую product-shell страницу системы
- **THEN** сверху страницы отображается общий `Navigation`
- **AND** этот `Navigation` остаётся единым паттерном для всего product-shell интерфейса

### Requirement: Левая часть Navigation перечисляет канонические entry point'ы

Система SHALL в левой части `Navigation` показывать ссылки `home`, `уровни`, `задачи`, `auth`, `config`, `help`.

#### Scenario: Пользователь смотрит на левую часть Navigation
- **WHEN** product-shell страница отрисована
- **THEN** в левой части `Navigation` видны ссылки `home`, `уровни`, `задачи`, `auth`, `config`, `help`
- **AND** каждая ссылка ведёт на соответствующий канонический top-level маршрут

### Requirement: Правая часть Navigation показывает постоянные контакты

Система SHALL в правой части `Navigation` показывать ссылки на `https://t.me/eduhund_bot` и `edu@eduhund.com`.

#### Scenario: Пользователь смотрит на правую часть Navigation
- **WHEN** product-shell страница отрисована
- **THEN** в правой части `Navigation` видны ссылки на Telegram-бот и email-контакт

## MODIFIED Requirements

### Requirement: Продукт имеет фиксированную top-level карту пользовательских URL

Система SHALL предоставлять пользователю следующие канонические top-level адреса:
- `/`
- `/tasks`
- `/levels`
- `/auth`
- `/config`
- `/help`

Именно эти top-level адреса SHALL составлять левую часть глобального `Navigation`.

#### Scenario: Пользователь ориентируется в основных разделах продукта
- **WHEN** пользователь открывает или копирует основной адрес продукта
- **THEN** top-level URL отражают структуру разделов продукта без скрытых экранов в query-параметрах
- **AND** глобальный `Navigation` использует их как канонические точки входа
