## Goals

- Сделать тестовый слой отдельным, пригодным для человека инструментом: понятные команды, понятная документация, предсказуемые режимы запуска.
- Связать тесты с `openspec/specs/**` так, чтобы было видно, какие requirements/scenarios реально проверяются.
- Дать проекту несколько уровней проверки: быстрый smoke, полный локальный слой, выборка по capability, отдельный live/provider-контур.
- Поддержать постепенное развитие: сначала полезный минимум, затем расширение покрытия без блокировки runtime и обычных продуктовых правок.
- Исключить случайную зависимость обязательных тестов от реальных credentials и внешних сервисов.
- Сохранить текущий стек: Vitest, Storybook/Vitest browser и доступный Playwright-контур без замены сборщика, Node.js или Next.js.

## Non-goals

- Не добиваемся 100% покрытия кода.
- Не переписываем все существующие тесты сразу.
- Не делаем manual QA-процесс и чеклисты ручного кликанья вместо автоматизированных проверок.
- Не меняем install-critical инфраструктуру.
- Не включаем live-проверки внешних провайдеров в обычный обязательный прогон.
- Не блокируем `npm run dev`, `npm run build` и продуктовый runtime на незавершённом покрытии specs.

## Current State

- В репозитории уже есть `vitest.config.ts` с проектами:
  - `unit`: `test/unit/**/*.test.ts`;
  - `storybook`: browser-проверки Storybook через Vitest browser + Playwright provider.
- В `test/unit` уже есть тесты для части доменов:
  - access-control/allowlist;
  - llm/Gemini/status/timeout;
  - onboarding status;
  - editor content/shortcuts;
  - task progress summary/presentation.
- Есть черновой документ `docs/testing-layer.md`, но он пока не является полным контрактом слоя.
- В `package.json` нет явных test-команд для unit/full/spec/e2e слоя.
- Активный change `testing-layer` до этой правки не содержит delta-spec, поэтому строгая OpenSpec-валидация не может быть закрыта.

## Target Shape

### Каталоги

Целевая структура должна быть простой и расширяемой:

- `test/unit/**/*.test.ts` — быстрые unit-тесты доменной логики.
- `test/integration/**/*.test.ts` — server/API-flow без реальных внешних сервисов.
- `test/e2e/**/*.spec.ts` — короткие browser smoke-сценарии.
- `test/specs/<capability>/**/*.test.ts` — spec-oriented тесты, когда сценарий удобнее держать рядом с capability, а не с техническим уровнем.
- `test/fixtures/**` — детерминированные данные.
- `test/helpers/**` — общие тестовые утилиты.
- `test/traceability/**` или `tools/testing/**` — проверка связи specs и тестов.

На раннем этапе допустимо не переносить существующие тесты: важнее добавить метаданные и команды, чем устроить крупное перемещение файлов.

### Уровни проверок

| Уровень | Назначение | Ожидаемая скорость | Credentials |
| --- | --- | --- | --- |
| static/contract | OpenSpec validate, traceability, документационные инварианты | быстро | нет |
| unit | чистая/серверная логика без браузера | быстро | нет |
| component/browser | Storybook и UI-состояния | средне | нет |
| integration | API/server-flow на mock/fixtures | средне | нет |
| e2e smoke | критические пользовательские маршруты в браузере | дольше | нет |
| provider/live | реальные LLM/provider-интеграции | дольше/нестабильно | да |

### Traceability

Выбранный формат: лёгкие метаданные в тестовом файле или рядом с ним, проверяемые скриптом.

Рекомендуемый минимальный формат в начале файла:

```ts
// @openSpec capability: llm
// @openSpec scenarios:
// @openSpec  - "Конфигурация выбрала Google Gemini"
// @openSpec  - "Initiator-запрос превысил отдельный timeout"
```

Правила:

- `capability` должен совпадать с каталогом `openspec/specs/<capability>/spec.md`.
- `scenarios` должны ссылаться на реальные `#### Scenario:` из spec.
- Один тестовый файл может покрывать несколько scenarios одного capability.
- Если capability временно не покрыт тестами, это фиксируется в отдельном allowlist/coverage-plan с причиной и этапом закрытия.
- Проверка traceability сначала вводится в отчётном режиме, затем становится строгой частью `test:full`.

### Минимальная планка покрытия

Capability считается готовым для текущего слоя, если:

- для каждого нового или изменённого requirement есть хотя бы один связанный тестовый сценарий;
- критичные negative/error cases покрыты там, где spec явно описывает ошибку;
- тест запускается одной из документированных команд;
- если сценарий требует внешнего сервиса, есть mock/integration-тест для обязательного слоя и отдельная live-проверка для реального провайдера;
- в change-задачах указана команда проверки.

Для существующих specs вводится миграционный режим:

- приоритет P0: `access-control`, `llm`, `google-gemini`, `deepseek`, `llm-endpoint`;
- приоритет P1: `task`, `task-levels`, `user-progress`, `level-labs`, `iteration`;
- приоритет P2: `navigation`, `ui-foundation`, `onboarding-repo`, `external-local-onboarding`, `component-file-set`, `admin-tools`.

### Команды

Целевые npm scripts:

- `test` — быстрый локальный прогон по умолчанию.
- `test:unit` — unit-проект Vitest.
- `test:storybook` — Storybook/Vitest browser.
- `test:integration` — integration-тесты без внешних сервисов.
- `test:e2e` — browser smoke.
- `test:traceability` — связь OpenSpec specs и тестов.
- `test:full` — полный обязательный локальный прогон без live credentials.
- `test:live` — опциональные provider/live-проверки с реальными credentials.
- `test:spec -- <capability>` — выборочная проверка capability или сценариев, связанных с ним.

Имена можно уточнить на реализации, но документация и `package.json` должны совпадать.

### Credentials и mock-данные

- Секреты передаются только через env или локальные некоммитимые файлы.
- `docs/testing-layer.md` должен перечислять переменные для live-проверок и объяснять, какие команды их используют.
- Mock/fixture-режим является дефолтом для `test`, `test:full`, `test:e2e`.
- Live-тесты явно маркируются и не запускаются из `test:full`.
- При отсутствии credentials live-команда должна давать понятную диагностику: какие переменные нужны и почему тест пропущен или остановлен.

## Implementation Strategy

1. **Контракт и команды без риска для runtime**
   - добавить delta-spec;
   - обновить docs;
   - добавить npm scripts, которые оборачивают уже существующие проверки;
   - не менять runtime-код.

2. **Traceability MVP**
   - добавить парсер `openspec/specs/**`;
   - добавить проверку метаданных тестов;
   - промаркировать существующие unit-тесты;
   - держать непокрытые legacy-specs в явном coverage-plan.

3. **Unit/integration расширение**
   - закрыть P0/P1 домены детерминированными unit/integration-тестами;
   - добавить helpers/fixtures там, где повторяются setup и mock provider.

4. **Browser/e2e smoke**
   - добавить минимальные сценарии: `/`, `/auth`, `/tasks`, `/levels`, критичные API/status состояния;
   - использовать mock/fixture-состояния и отдельный тестовый user-state.

5. **Ужесточение**
   - включить строгую traceability-проверку в `test:full`;
   - обновить `AGENTS.md`/change guidance;
   - зафиксировать критерии закрытия будущих changes.

## Risks / Tradeoffs

- Слишком строгая traceability на старте может заблокировать обычную работу. Поэтому нужен coverage-plan и постепенное ужесточение.
- E2E может стать медленным и хрупким. Поэтому e2e-слой должен быть коротким smoke, а детали поведения лучше держать в unit/integration.
- Метаданные в комментариях могут устаревать. Это компенсируется скриптом, который сверяет названия scenarios со spec-файлами.
- Часть UI-сценариев лучше покрывать Storybook/browser, а не полным e2e. Это быстрее и проще поддерживать.
- Live provider-тесты полезны, но нестабильны из-за сети и квот. Они должны быть отдельными и явно маркированными.

## Open Questions

- Достаточно ли комментариев `@openSpec` или понадобится отдельный машинный индекс для сложных связей?
- Делать ли `test/spec -- <capability>` через npm script с аргументом или через отдельный `tools/testing/run-spec-tests.mjs`?
- Нужно ли добавлять отдельный Playwright config для e2e или на первом этапе достаточно Vitest browser/Storybook + небольших smoke-скриптов?
- Какой минимальный e2e-набор считать обязательным до появления стабильных тестовых данных onboarding/user-state?
