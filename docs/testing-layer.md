# Единый слой тестирования

Этот документ описывает текущий runnable-слой тестирования и целевой контур change `testing-layer`.

Слой развивается постепенно. Уже реализованные команды должны быть пригодны для ежедневного запуска человеком; будущие уровни пока имеют честные placeholder-команды и не блокируют runtime.

## Быстрый старт

Перед небольшой правкой запускай быстрый слой:

```bash
npm test
```

Сейчас это алиас на unit-проверки:

```bash
npm run test:unit
```

Команда не требует live credentials и не предполагает ручного кликанья в браузере.

## Команды

| Команда | Статус | Что делает |
| --- | --- | --- |
| `npm test` | работает | Быстрый локальный прогон, сейчас запускает `test:unit`. |
| `npm run test:unit` | работает | Запускает Vitest project `unit` по `test/unit/**/*.test.ts`. |
| `npm run test:storybook` | работает | Запускает Vitest project `storybook`; если story-файлов пока нет, команда завершается успешно. |
| `npm run test:full` | работает | Полный обязательный слой текущего этапа: unit + strict traceability. |
| `npm run test:traceability` | работает в мягком режиме | Проверяет `@openSpec` metadata в тестах и сверяет её с `openspec/specs/**`. |
| `npm run test:integration` | placeholder | Зарезервировано для server/API-flow тестов на mock/fixtures. |
| `npm run test:e2e` | работает частично | Запускает Playwright route smoke без live credentials; runtime-зависимые маршруты могут быть явно skipped с причиной. |
| `npm run test:live` | placeholder | Зарезервировано для явных provider/live-проверок с реальными credentials. |
| `npm run test:spec -- <capability>` | placeholder | Зарезервировано для выборочного запуска по OpenSpec capability. |

Placeholder-команды завершаются успешно и печатают, какой этап `testing-layer` должен наполнить команду реальной проверкой. Это сделано намеренно: первый слой должен дать стабильные точки входа, но не должен ломать обычную разработку из-за ещё не реализованных уровней.

`test:traceability` уже не placeholder: команда валидирует существующие связи тестов со specs. Пока она работает в миграционном режиме: неполное покрытие существующих specs допустимо только если capability есть в `test/traceability/coverage-plan.json`.

## Unit

Unit-проверки запускаются так:

```bash
npm run test:unit
```

Для выборки по названию теста можно передать аргументы Vitest:

```bash
npm run test:unit -- -t "часть названия"
```

Текущий unit-проект настроен в `vitest.config.ts`:

- окружение: `node`;
- шаблон файлов: `test/unit/**/*.test.ts`;
- реальные внешние credentials не требуются.

## Storybook / browser

Browser-проверки Storybook запускаются так:

```bash
npm run test:storybook
```

Этот уровень предназначен для компонентных и визуально-интерактивных состояний. Сквозные пользовательские маршруты будут выделены отдельно в `npm run test:e2e`.

Если story-файлов пока нет, команда считается успешной. Это позволяет держать точку входа стабильной и добавлять browser-тесты постепенно.

## E2E smoke

Короткий браузерный smoke запускается так:

```bash
npm run test:e2e
```

Команда использует `playwright.e2e.config.ts`, стартует отдельный `next dev` на `127.0.0.1:3410` и принудительно очищает live/provider env для тестового процесса. Поэтому e2e smoke не требует реальных LLM ключей, allowlist-хранилища или `ONBOARDING_REPO_URL`.

По умолчанию Playwright запускается через установленный системный Google Chrome (`channel: chrome`). Если нужно использовать другой канал, задай:

```bash
PLAYWRIGHT_BROWSER_CHANNEL=chromium npm run test:e2e
```

Если dev-server уже поднят отдельно, можно запускать против него:

```bash
DESENGINE_E2E_EXTERNAL_SERVER=1 DESENGINE_E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Текущий smoke-набор живёт в `test/e2e/route-smoke.spec.ts`:

- публичные маршруты `/auth` и `/config` должны открываться без допуска;
- защищённый `/` без допуска должен переводить на `/auth`;
- `/tasks`, `/levels`, task entry и level entry уже перечислены как обязательный набор, но временно skipped, пока параллельный runtime-переезд task/user schema не стабилизирован.

E2E helper снимает snapshot каталога `user/` до и после активных сценариев. Если smoke начнёт менять пользовательское состояние, команда упадёт.

## Полный прогон

Полный обязательный прогон текущего этапа:

```bash
npm run test:full
```

Сейчас команда запускает `test:unit`, затем `test:traceability`. По мере стабилизации integration/e2e-слоя в неё можно добавлять дополнительные обязательные проверки.

`test:full` не должен запускать live/provider-проверки с реальными внешними сервисами.

## Выборочный запуск по OpenSpec capability

Целевая команда:

```bash
npm run test:spec -- llm
```

Пока это placeholder. Реальная выборка по capability появится после внедрения traceability metadata `@openSpec`.

## Traceability OpenSpec

Проверка связи тестов со specs запускается так:

```bash
npm run test:traceability
```

Формат metadata в тестовом файле:

```ts
// @openSpec capability: llm
// @openSpec scenarios:
// @openSpec  - "Конфигурация выбрала Google Gemini"
// @openSpec  - "Initiator-запрос превысил отдельный timeout"
```

Правила:

- `capability` должен совпадать с каталогом `openspec/specs/<capability>/spec.md`.
- Каждый scenario должен точно совпадать с заголовком `#### Scenario:` в соответствующем spec.
- Один тестовый файл может содержать несколько блоков `@openSpec capability`, если он покрывает несколько capability.
- Если capability покрыт не полностью, он должен быть описан в `test/traceability/coverage-plan.json`.
- Файл `openspec/specs/spec.md` считается обзорной wiki-страницей и не участвует в traceability capability-списке.

## Live/provider-режим

Live/provider-проверки запускаются только явно:

```bash
npm run test:live
```

На текущем этапе это placeholder. В дальнейшем команда будет читать credentials только из env или локальных некоммитимых файлов и будет отдельно объяснять, каких переменных не хватает.

Обычные команды `npm test` и `npm run test:full` не должны требовать live credentials.

### Env для live-проверок

LLM provider-проверки используют только выбранный набор переменных:

| Provider | Переменные |
| --- | --- |
| OpenAI | `LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` |
| DeepSeek | `LLM_PROVIDER`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL` |
| Google Gemini | `LLM_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL` |

Дополнительные live-контуры, если они появятся:

- allowlist: `ALLOWLIST_BASE_URL`, `ALLOWLIST_SALT`;
- onboarding: `ONBOARDING_REPO_URL`.

Секреты не коммитятся. Для локального запуска используй env процесса или локальный `desengine.config.txt`; тестовые helpers не должны печатать значения секретов в диагностике.

## Fixtures и helpers

Общие тестовые helpers и fixtures живут в `test/**`, отдельно от runtime-кода:

- `test/helpers/test-env.ts` — безопасное чтение env для live-тестов без печати секретных значений;
- `test/e2e/fixtures/smoke-fixture.ts` — route smoke-набор и snapshot helper для проверки, что e2e не портит `user/`;
- `test/fixtures/user-state.ts` — детерминированные user-state fixtures;
- `test/fixtures/task-progress.ts` — уровни, task config и progress-state для сценариев прогресса;
- `test/fixtures/onboarding-status.ts` — состояния onboarding-маркера и синхронизации;
- `test/fixtures/provider-responses.ts` — mock-ответы LLM-провайдеров.
- `test/traceability/spec-coverage-map.json` — карта specs по приоритетам P0/P1/P2 и обязательным сценариям;
- `test/traceability/coverage-plan.json` — migration-план для capability, которые пока покрыты не полностью.

Обязательные `npm test` и `npm run test:full` используют mock/fixtures и не требуют live credentials.

## Как добавлять тесты сейчас

- Новую быструю проверку доменной логики добавляй в `test/unit/**/*.test.ts`.
- Не храни секреты и реальные provider credentials в тестах.
- Если сценарий требует внешнего сервиса, на этом этапе добавляй mock/unit-проверку, а live-проверку планируй отдельно.
- Для behavior-change фиксируй в OpenSpec tasks команду, которой проверяется изменение.

## Тестовая часть change

Каждый новый или изменяющий поведение OpenSpec change должен иметь отдельную тестовую часть. Новый change, созданный через `npm run openspec:new -- <name>`, автоматически получает базовый чеклист в `tasks.md`.

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

Выбор уровня:

- `static/contract` — документация, OpenSpec, source-contract и traceability-инварианты.
- `unit` — быстрая доменная или server-логика без браузера.
- `component/browser` — UI-состояния в Storybook/Vitest browser.
- `integration` — API/server-flow на mock/fixtures.
- `e2e smoke` — короткий сквозной browser route smoke без live credentials.
- `live/provider` — только явная проверка с реальными внешними сервисами; не входит в обязательный `test:full`.

Если полный тест сейчас нельзя добавить без крупной runtime-работы, это нормально, но отсрочка должна быть видимой: добавь capability в `test/traceability/coverage-plan.json`, укажи причину, `targetStage` и минимальный follow-up.

## Следующие этапы change

- `2. Traceability MVP`: metadata `@openSpec`, проверка существования capability/scenarios, coverage-plan.
- `3. Фикстуры, helpers и credentials`: единые mock/fixtures и безопасное чтение test env.
- `4. Unit и integration покрытие specs`: расширение покрытия P0/P1/P2 specs.
- `5. Browser, Storybook и e2e smoke`: короткие браузерные сценарии без порчи локального состояния пользователя.
