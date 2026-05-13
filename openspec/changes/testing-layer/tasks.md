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
- [ ] 4.4 Для P2 specs зафиксировать минимальное покрытие или явный coverage-plan: `navigation`, `ui-foundation`, `onboarding-repo`, `external-local-onboarding`, `component-file-set`, `admin-tools`
- [ ] 4.5 Перевести traceability-проверку из отчётного режима в строгий режим для покрытых capability

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

## 5. Browser, Storybook и e2e smoke

- [ ] 5.1 Определить минимальный e2e smoke-набор критических маршрутов: `/`, `/auth`, `/tasks`, `/levels`, task/level entry
- [ ] 5.2 Подготовить тестовый user-state/onboarding fixture, не зависящий от реальных данных пользователя
- [ ] 5.3 Добавить e2e smoke-команду без live credentials
- [ ] 5.4 Разнести UI-сценарии между Storybook/browser и e2e: состояния компонентов — в Storybook/browser, сквозные маршруты — в e2e
- [ ] 5.5 Проверить, что e2e не меняет и не портит обычное локальное состояние пользователя

## 6. Правило change → тесты

- [ ] 6.1 Обновить `AGENTS.md`: новый или изменённый behavior-change обязан указывать тестовый уровень, команду запуска и mock/live требования
- [ ] 6.2 Обновить `tools/create-openspec-change.mjs` или change guidance, чтобы новые changes получали тестовый чеклист
- [ ] 6.3 Добавить в документацию пример тестовой части для типового change
- [ ] 6.4 Зафиксировать, что если тестовое покрытие откладывается, change обязан добавить запись в coverage-plan с причиной и сроком закрытия

## 7. Ужесточение и финальная проверка

- [ ] 7.1 Подключить строгую traceability-проверку к `test:full`
- [ ] 7.2 Прогнать `npm run test:full`
- [ ] 7.3 Прогнать `openspec validate testing-layer --strict`
- [ ] 7.4 Обновить итоговую документацию по фактическим командам и ограничениям
- [ ] 7.5 Подготовить change к архивированию после успешной реализации
