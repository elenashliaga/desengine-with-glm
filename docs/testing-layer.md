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
| `npm run test:full` | работает частично | Полный обязательный слой текущего этапа, сейчас запускает `test:unit`. |
| `npm run test:traceability` | работает в мягком режиме | Проверяет `@openSpec` metadata в тестах и сверяет её с `openspec/specs/**`. |
| `npm run test:integration` | placeholder | Зарезервировано для server/API-flow тестов на mock/fixtures. |
| `npm run test:e2e` | placeholder | Зарезервировано для коротких browser smoke-сценариев. |
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

## Полный прогон

На первом этапе полный прогон ограничен уже работающим обязательным слоем:

```bash
npm run test:full
```

Сейчас команда запускает `test:unit`. По мере реализации change в неё будут добавляться строгая traceability-проверка, integration и e2e smoke.

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

## Следующие этапы change

- `2. Traceability MVP`: metadata `@openSpec`, проверка существования capability/scenarios, coverage-plan.
- `3. Фикстуры, helpers и credentials`: единые mock/fixtures и безопасное чтение test env.
- `4. Unit и integration покрытие specs`: расширение покрытия P0/P1/P2 specs.
- `5. Browser, Storybook и e2e smoke`: короткие браузерные сценарии без порчи локального состояния пользователя.
