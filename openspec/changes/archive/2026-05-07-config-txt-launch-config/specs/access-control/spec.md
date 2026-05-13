## MODIFIED Requirements

### Requirement: Базовый URL allowlist задаётся конфигурацией приложения

Система SHALL брать базовый URL allowlist-хранилища из конфигурации `lab`, а не зашивать его в код.

#### Scenario: Развёртывание использует другой allowlist-hosting
- **WHEN** оператор меняет значение `ALLOWLIST_BASE_URL`
- **THEN** приложение проверяет маркеры по новому базовому URL без изменения кода

#### Scenario: Конфигурация доступа задаётся через локальный конфиг-файл
- **WHEN** оператор задаёт `ALLOWLIST_BASE_URL` и `ALLOWLIST_SALT` в `desengine.config.txt`
- **THEN** приложение использует эти значения для проверки допуска

#### Scenario: Оператор открывает шаблон доступа по email
- **WHEN** оператор открывает `desengine.config-example.txt`
- **THEN** значения `ALLOWLIST_BASE_URL` и `ALLOWLIST_SALT` уже присутствуют в шаблоне
- **AND** оператору не нужно восстанавливать их вручную перед первым локальным запуском
