## MODIFIED Requirements

### Requirement: Базовый URL allowlist задаётся конфигурацией приложения

Система SHALL брать базовый URL allowlist-хранилища из конфигурации `lab`, а не зашивать его в код.

#### Scenario: Развёртывание использует другой allowlist-hosting
- **WHEN** оператор меняет значение `DESENGINE_ALLOWLIST_BASE_URL`
- **THEN** приложение проверяет маркеры по новому базовому URL без изменения кода

#### Scenario: Конфигурация доступа задаётся через локальный конфиг-файл
- **WHEN** оператор задаёт `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` в `config.txt`
- **THEN** приложение использует эти значения для проверки допуска

#### Scenario: Оператор открывает шаблон доступа по email
- **WHEN** оператор открывает `config-example.txt`
- **THEN** значения `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` уже присутствуют в шаблоне
- **AND** оператору не нужно восстанавливать их вручную перед первым локальным запуском
