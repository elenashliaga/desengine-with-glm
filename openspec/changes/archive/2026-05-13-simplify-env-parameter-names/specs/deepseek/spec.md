## MODIFIED Requirements

### Requirement: Конфигурация DeepSeek задаётся явно

Система SHALL брать параметры подключения к DeepSeek из локальной конфигурации приложения.

#### Scenario: Оператор настраивает DeepSeek
- **WHEN** оператор задаёт обязательные параметры подключения к DeepSeek
- **THEN** система использует их без изменения кода

#### Scenario: DeepSeek включён как активный провайдер
- **WHEN** оператор задаёт активный LLM-провайдер как `deepseek`
- **AND** задаёт `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` и при необходимости `DEEPSEEK_BASE_URL`
- **THEN** лаборатория использует именно эти параметры для LLM-вызовов
