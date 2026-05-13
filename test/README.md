# Тестовый слой

Этот каталог содержит автоматизированный тестовый слой desengine. Он нужен для проверки изменений человеком через понятные команды, а не для ручного кликанья по приложению.

Основной подробный документ: `docs/testing-layer.md`.

## Что запускать

Перед небольшой правкой:

```bash
npm test
```

Перед закрытием change:

```bash
npm run test:full
```

Сейчас `test:full` запускает:

```bash
npm run test:unit
npm run test:traceability
```

Браузерный smoke запускается отдельно:

```bash
npm run test:e2e
```

Live/provider-проверки не входят в обычный обязательный прогон и запускаются только явно:

```bash
npm run test:live
```

## Команды

| Команда | Назначение |
| --- | --- |
| `npm test` | Быстрый локальный прогон, сейчас alias на `test:unit`. |
| `npm run test:unit` | Unit/source-contract проверки в `test/unit/**/*.test.ts`. |
| `npm run test:traceability` | Проверка связи `@openSpec` metadata с `openspec/specs/**`. |
| `npm run test:full` | Обязательный слой текущего этапа: unit + traceability. |
| `npm run test:storybook` | Browser/component проверки Storybook; пока успешно проходит без story-файлов. |
| `npm run test:e2e` | Playwright route smoke без live credentials. |
| `npm run test:integration` | Зарезервировано для server/API-flow на fixtures. |
| `npm run test:live` | Зарезервировано для явных проверок с реальными credentials. |
| `npm run test:spec -- <capability>` | Зарезервировано для выборочного запуска по OpenSpec capability. |

## Структура

- `unit/` — быстрые unit и source-contract тесты.
- `e2e/` — короткие Playwright smoke-сценарии критичных маршрутов.
- `fixtures/` — детерминированные данные для тестов.
- `helpers/` — общие тестовые helper-функции.
- `shims/` — тестовые замены runtime-only модулей.
- `traceability/` — карта покрытия OpenSpec и migration coverage-plan.

## Unit

Unit-тесты запускаются командой:

```bash
npm run test:unit
```

Для выборочного запуска можно передать фильтр Vitest:

```bash
npm run test:unit -- -t "часть названия"
```

Новые быстрые проверки доменной логики, server-логики и source-contract инвариантов добавляй в `test/unit/**/*.test.ts`.

## Traceability OpenSpec

Если тест покрывает OpenSpec-сценарий, добавь metadata в начало файла:

```ts
// @openSpec capability: llm
// @openSpec scenarios:
// @openSpec  - "Конфигурация выбрала Google Gemini"
```

Правила:

- `capability` должен совпадать с каталогом `openspec/specs/<capability>/spec.md`.
- scenario должен точно совпадать с заголовком `#### Scenario:` в spec.
- Один файл может содержать несколько блоков `@openSpec capability`.
- Если capability временно покрыт не полностью, он должен быть описан в `test/traceability/coverage-plan.json`.

Проверка:

```bash
npm run test:traceability
```

## E2E smoke

E2E запускается через `playwright.e2e.config.ts`:

```bash
npm run test:e2e
```

Команда стартует отдельный `next dev` на `127.0.0.1:3410`, очищает live/provider env для тестового процесса и не требует реальных LLM ключей, allowlist-хранилища или `ONBOARDING_REPO_URL`.

По умолчанию используется системный Google Chrome:

```bash
PLAYWRIGHT_BROWSER_CHANNEL=chrome npm run test:e2e
```

Если нужно использовать уже запущенный dev-server:

```bash
DESENGINE_E2E_EXTERNAL_SERVER=1 DESENGINE_E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Текущий route smoke:

- `/auth` и `/config` открываются без допуска;
- `/` без допуска переводит на `/auth`;
- `/tasks`, `/levels`, task entry и level entry перечислены в наборе, но временно skipped до стабилизации параллельного runtime-переезда task/user schema.

E2E helper делает snapshot каталога `user/` до и после активных сценариев. Если smoke меняет пользовательское состояние, тест должен упасть.

## Fixtures и credentials

Обычные команды `npm test`, `npm run test:unit`, `npm run test:full` и `npm run test:e2e` не должны требовать live credentials.

Секреты нельзя хранить в git. Для live/provider-проверок использовать только env или локальные некоммитимые файлы.

Переменные для будущих live-проверок:

- OpenAI: `LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`.
- DeepSeek: `LLM_PROVIDER`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL`.
- Google Gemini: `LLM_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL`.
- Allowlist: `ALLOWLIST_BASE_URL`, `ALLOWLIST_SALT`.
- Onboarding: `ONBOARDING_REPO_URL`.

## Как добавлять тест для change

Каждый behavior-change должен иметь тестовую часть в OpenSpec tasks:

- затронутые capability/scenarios;
- уровень проверки: static/contract, unit, component/browser, integration, e2e smoke или live/provider;
- команда запуска;
- mock/fixture-данные;
- live credentials, если они нужны;
- запись в `test/traceability/coverage-plan.json`, если покрытие откладывается.

Новый change, созданный через `npm run openspec:new -- <name>`, автоматически получает базовый тестовый чеклист в `tasks.md`.

Минимальный пример:

```md
## Тестовая часть change

- [ ] Указать затронутые OpenSpec capability/scenarios
- [ ] Выбрать уровень проверки: unit
- [ ] Добавить unit-тест в `test/unit/example.test.ts`
- [ ] Зафиксировать команду проверки: `npm run test:unit -- example.test.ts`
- [ ] Описать mock/fixture-данные: используются локальные fixtures, live credentials не нужны
- [ ] Если покрытие откладывается, добавить запись в `test/traceability/coverage-plan.json` с причиной и этапом закрытия
```
