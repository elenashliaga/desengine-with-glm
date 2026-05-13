## MODIFIED Requirements

### Requirement: Конфигурация Google Gemini задаётся явно

Система SHALL брать параметры подключения к Google Gemini из локальной конфигурации приложения.

#### Scenario: Оператор настраивает Google Gemini
- **WHEN** оператор задаёт обязательные параметры подключения к Google Gemini
- **THEN** система использует их без изменения кода

#### Scenario: Google Gemini включён как активный провайдер
- **WHEN** оператор задаёт активный LLM-провайдер как `gemini`
- **AND** задаёт `GEMINI_API_KEY`, `GEMINI_MODEL` и при необходимости `GEMINI_BASE_URL`
- **THEN** лаборатория использует именно эти параметры для LLM-вызовов
