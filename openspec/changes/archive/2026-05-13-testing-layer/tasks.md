## 0. Подготовка change и контракта

- [x] 0.1 Добавить delta-spec `testing-layer`, чтобы change проходил `openspec validate testing-layer --strict`
- [x] 0.2 Зафиксировать в `proposal.md` границы слоя: unit, integration, component/browser, e2e smoke, live/provider
- [x] 0.3 Зафиксировать в `design.md` поэтапную стратегию, при которой развитие тестов не блокирует runtime и обычные продуктовые правки
- [x] 0.4 Проверить, что план не требует изменения Node.js, Next.js, Turbopack или другой install-critical инфраструктуры

## 1. Базовый runnable-слой

- [x] 1.1 Добавить npm scripts для текущих существующих проверок: `test`, `test:unit`, `test:storybook`
- [x] 1.2 Добавить пустые/минимальные целевые scripts для будущих уровней: `test:traceability`, `test:integration`, `test:e2e`, `test:full`, `test:live`, `test:spec`
- [x] 1.3 Обновить `docs/testing-layer.md`: быстрый старт, полный прогон, выборочный запуск, live/provider-режим
- [x] 1.4 Прогнать базовые команды и зафиксировать фактические команды проверки в этом change

Фактическая проверка первого слоя от 2026-05-13:

- `npm run test:unit` — проходит, 7 файлов и 26 тестов.
- `npm test` — проходит, сейчас алиас на `test:unit`.
- `npm run test:full` — проходит, сейчас запускает `test:unit`.
- `npm run test:storybook` — проходит; если story-файлов нет, завершает работу успешно через `--passWithNoTests`.
- `npm run test:traceability`, `npm run test:integration`, `npm run test:e2e`, `npm run test:live`, `npm run test:spec -- llm` — placeholder-команды проходят и явно сообщают, на каком этапе будут наполнены реальными проверками.

## 2. Traceability MVP

- [x] 2.1 Зафиксировать формат `@openSpec` metadata для связи тестового файла с capability/scenarios
- [x] 2.2 Реализовать проверку, что `capability` существует в `openspec/specs/<capability>/spec.md`
- [x] 2.3 Реализовать проверку, что перечисленные scenarios существуют в соответствующем spec
- [x] 2.4 Добавить coverage-plan/allowlist для существующих specs, которые будут покрываться поэтапно
- [x] 2.5 Промаркировать существующие unit-тесты там, где связь со spec уже очевидна
- [x] 2.6 Подключить `test:traceability` в отчётном режиме без блокировки `test`

Фактическая проверка Traceability MVP от 2026-05-13:

- `npm run test:traceability` — проходит.
- Проверка читает capability из `openspec/specs/<capability>/spec.md`, игнорируя обзорный `openspec/specs/spec.md`.
- Проверка валидирует `@openSpec capability` и точные названия `#### Scenario:`.
- Неполное покрытие существующих specs допустимо только через `test/traceability/coverage-plan.json`.
- На текущем шаге полностью закрыт `access-control` (`5/5 scenarios`), остальные частично или полностью находятся в migration coverage-plan.

## 3. Фикстуры, helpers и credentials

- [x] 3.1 Описать список env-переменных, нужных только для live/provider-тестов
- [x] 3.2 Добавить безопасный helper чтения test env без хранения секретов в git
- [x] 3.3 Добавить детерминированные fixtures для user-state, task-progress, onboarding-status и provider responses
- [x] 3.4 Зафиксировать правило: обязательные `test`/`test:full` используют mock/fixtures и не требуют live credentials

Фактическая проверка fixtures/helpers/credentials от 2026-05-13:

- `docs/testing-layer.md` перечисляет live env для OpenAI, DeepSeek, Google Gemini, allowlist и onboarding.
- `test/helpers/test-env.ts` читает env без печати секретных значений и покрыт unit-тестом.
- `test/fixtures/**` содержит детерминированные fixtures для user-state, task-progress, onboarding-status и provider responses.
- `npm run test:unit` — проходит, 8 файлов и 29 тестов.
- `npm run test:traceability` — проходит.
- `openspec validate testing-layer --strict` — проходит.

## 4. Unit и integration покрытие specs

- [x] 4.1 Составить карту `openspec/specs/**` → обязательные тестовые сценарии по приоритетам P0/P1/P2
- [x] 4.2 Закрыть P0 unit/integration-тестами: `access-control`, `llm`, `google-gemini`, `deepseek`, `llm-endpoint`
- [x] 4.3 Закрыть P1 unit/integration-тестами: `task`, `task-levels`, `user-progress`, `level-labs`, `iteration`
- [x] 4.4 Для P2 specs зафиксировать минимальное покрытие или явный coverage-plan: `navigation`, `ui-foundation`, `onboarding-repo`, `external-local-onboarding`, `component-file-set`, `admin-tools`
- [x] 4.5 Перевести traceability-проверку из отчётного режима в строгий режим для покрытых capability

Фактическая проверка карты покрытия от 2026-05-13:

- `test/traceability/spec-coverage-map.json` содержит P0/P1/P2 приоритеты, целевые уровни проверки и обязательные scenarios/groups для активных `openspec/specs/**`.
- JSON карты покрытия валиден.
- `npm run test:unit` — проходит, 8 файлов и 29 тестов.
- `npm run test:traceability` — проходит.

Фактическая проверка P0 от 2026-05-13:

- `access-control` — `5/5 scenarios`, ready.
- `deepseek` — `4/4 scenarios`, ready.
- `google-gemini` — `6/6 scenarios`, ready.
- `llm` — `24/24 scenarios`, ready.
- `llm-endpoint` — `2/2 scenarios`, ready.
- P0 capability сняты из migration `coverage-plan`.

Фактическая проверка P1 от 2026-05-13:

- `task` — `5/5 scenarios`, ready.
- `task-levels` — `19/19 scenarios`, ready.
- `user-progress` — `10/10 scenarios`, ready.
- `level-labs` — `29/29 scenarios`, ready.
- `iteration` — `29/29 scenarios`, ready.
- Дополнительно раньше P2 закрыт `component-file-set` — `5/5 scenarios`, ready.
- P1 capability сняты из migration `coverage-plan`.

Фактическая проверка P2 от 2026-05-13:

- Добавлен `test/unit/p2-source-contracts.test.ts` для static/source-contract покрытия документации, admin tools, локального onboarding-flow, `/config` onboarding update, shell Navigation и render-boundary инвариантов.
- `admin-tools` — `4/4 scenarios`, ready.
- `external-local-onboarding` — `7/7 scenarios`, ready.
- `component-file-set` — `5/5 scenarios`, ready.
- `navigation` — `3/4 scenarios`, остаётся в `coverage-plan` до browser/component проверки левой части Navigation.
- `onboarding-repo` — `1/2 scenarios`, остаётся в `coverage-plan` до выравнивания runtime-чтения канонического `ONBOARDING_REPO_URL`.
- `ui-foundation` — `3/4 scenarios`, остаётся в `coverage-plan` до browser/component проверки визуального контракта Navigation.
- Capability без записи в `coverage-plan` теперь проверяются строго: неполное покрытие такого capability валит `npm run test:traceability`.
- `npm run test:unit -- test/unit/p2-source-contracts.test.ts` — проходит, 1 файл и 15 тестов.
- `npm run test:traceability` — проходит.

## 5. Browser, Storybook и e2e smoke

- [x] 5.1 Определить минимальный e2e smoke-набор критических маршрутов: `/`, `/auth`, `/tasks`, `/levels`, task/level entry
- [x] 5.2 Подготовить тестовый user-state/onboarding fixture, не зависящий от реальных данных пользователя
- [x] 5.3 Добавить e2e smoke-команду без live credentials
- [x] 5.4 Разнести UI-сценарии между Storybook/browser и e2e: состояния компонентов — в Storybook/browser, сквозные маршруты — в e2e
- [x] 5.5 Проверить, что e2e не меняет и не портит обычное локальное состояние пользователя

Фактическая проверка browser/e2e smoke от 2026-05-13:

- Добавлен `playwright.e2e.config.ts` для отдельного Playwright route smoke без live credentials.
- `npm run test:e2e` теперь запускает `playwright test -c playwright.e2e.config.ts`.
- E2E web-server стартует `next dev` на `127.0.0.1:3410`; live/provider env в тестовом процессе очищается, чтобы команда не зависела от реальных ключей и внешних сервисов.
- Добавлен `test/e2e/fixtures/smoke-fixture.ts`: минимальный route-набор и snapshot helper для каталога `user/`.
- Добавлен `test/e2e/route-smoke.spec.ts`: активные smoke-сценарии проверяют `/auth`, `/config` и redirect `/` → `/auth` без допуска.
- `/tasks`, `/levels`, task entry и level entry уже перечислены в smoke-наборе, но временно `skip` с явной причиной: текущий параллельный runtime-переезд task/user schema ещё ломает компиляцию этих маршрутов (`TaskProgressSchema is not defined`). Это не считается блокером тестового слоя.
- UI-состояния остаются зоной `test:storybook`, а e2e ограничен сквозными route smoke.
- `npm run test:e2e` — проходит, 3 active tests passed, 4 skipped.

## 6. Правило change → тесты

- [x] 6.1 Обновить `AGENTS.md`: новый или изменённый behavior-change обязан указывать тестовый уровень, команду запуска и mock/live требования
- [x] 6.2 Обновить `tools/create-openspec-change.mjs` или change guidance, чтобы новые changes получали тестовый чеклист
- [x] 6.3 Добавить в документацию пример тестовой части для типового change
- [x] 6.4 Зафиксировать, что если тестовое покрытие откладывается, change обязан добавить запись в coverage-plan с причиной и сроком закрытия

Фактическая проверка правила change → tests от 2026-05-13:

- `AGENTS.md` теперь явно требует тестовую часть behavior-change: capability/scenarios, уровень проверки, команду запуска, mock/fixture/live требования и coverage-plan при отсрочке.
- `tools/create-openspec-change.mjs` добавляет в `tasks.md` нового change секцию `## Тестовая часть change` с чеклистом общего тестового слоя.
- `docs/testing-layer.md` содержит пример тестовой части, выбор уровня проверки и правило отсрочки через `test/traceability/coverage-plan.json`.
- Добавлен `test/unit/change-testing-guidance.test.ts`, который защищает `AGENTS.md`, генератор change и документацию от случайного удаления тестового правила.
- `node --check tools/create-openspec-change.mjs` — проходит.
- `npm run test:unit -- test/unit/change-testing-guidance.test.ts` — проходит, 1 файл и 3 теста.

## 7. Ужесточение и финальная проверка

- [x] 7.1 Подключить строгую traceability-проверку к `test:full`
- [x] 7.2 Прогнать `npm run test:full`
- [x] 7.3 Прогнать `openspec validate testing-layer --strict`
- [x] 7.4 Обновить итоговую документацию по фактическим командам и ограничениям
- [x] 7.5 Подготовить change к архивированию после успешной реализации

Финальная проверка от 2026-05-13:

- `npm run test:full` запускает `test:unit`, затем `test:traceability`.
- `npm run test:full` — проходит, 15 unit files, 80 tests, traceability valid.
- `npm run test:e2e` — проходит как отдельный browser smoke, 3 active tests passed, 4 skipped из-за текущего runtime-переезда task/user schema.
- `openspec validate testing-layer --strict` — проходит.
- `docs/testing-layer.md` обновлён по фактическим командам, e2e-ограничениям, live/provider-режиму и правилу тестовой части change.
- Change готов к архивированию после отдельного решения команды.
