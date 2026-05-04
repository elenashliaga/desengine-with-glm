## ADDED Requirements

### Requirement: Система поддерживает адаптер Anthropic Claude

Система SHALL поддерживать отдельный адаптер для Anthropic Claude.

#### Scenario: Оператор выбирает Anthropic Claude
- **WHEN** конфигурация приложения переключена на Anthropic Claude
- **THEN** система использует адаптер Anthropic Claude для LLM-вызовов

### Requirement: Конфигурация Anthropic Claude задаётся явно

Система SHALL брать параметры подключения к Anthropic Claude из локальной конфигурации приложения.

#### Scenario: Оператор настраивает Anthropic Claude
- **WHEN** оператор задаёт обязательные параметры подключения к Anthropic Claude
- **THEN** система использует их без изменения кода

### Requirement: Ошибки Anthropic Claude различаются по типам

Система SHALL различать как минимум следующие классы ошибок для Anthropic Claude:
- неполная конфигурация;
- ошибка авторизации;
- недоступность endpoint;
- таймаут;
- невалидный ответ провайдера.

#### Scenario: Авторизация Anthropic Claude не прошла
- **WHEN** провайдер возвращает ошибку авторизации
- **THEN** пользователь видит понятное сообщение об ошибке доступа к Anthropic Claude
