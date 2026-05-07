## Why

Сейчас содержимое `onboarding/levels/<levelId>/` смешивает два разных класса данных:
- открытые level-материалы, которые пользователь потенциально может увидеть в интерфейсе;
- скрытые prompt-материалы, которые относятся к внутренней логике генерации и не должны лежать рядом с пользовательским контентом.

На практике это видно по тому, что:
- `overview.md` уже играет роль открытого пользовательского описания уровня;
- `init-prompt.md` лежит в той же папке уровня, хотя относится к скрытому prompt-контуру;
- didactic prompt уже живёт отдельно в `onboarding/prompts/levels/`.

Нужна более строгая и понятная граница: всё потенциально видимое пользователю остаётся в `levels/`, а все скрытые детали prompt-логики переходят в `prompts/`.

## What Changes

- Фиксируем, что `onboarding/levels/<levelId>/` хранит только открытые level-материалы.
- Фиксируем, что все level-specific prompt-материалы хранятся только в `onboarding/prompts/levels/<levelId>/`.
- Фиксируем перенос `init-prompt.md` из `onboarding/levels/<levelId>/` в `onboarding/prompts/levels/<levelId>/init.md`.
- Фиксируем, что didactic prompt тоже живёт в `onboarding/prompts/levels/<levelId>/didactic.md`.
- Фиксируем упрощение контракта: отдельный `promptKey` больше не нужен, prompt-материалы определяются по самому `levelId`.

## Capabilities

### Modified Capabilities
- `onboarding-repo`: onboarding-контент получает явное разделение на открытый level-контур и скрытый prompt-контур.
- `level-labs`: уровень хранит только пользовательски видимую информацию и открытые настройки.
- `llm`: level-specific prompt-данные читаются из скрытого prompt-слоя по `levelId`, без отдельного `promptKey`.

## Impact

- Content layout: потребуется перенести скрытые level prompts из `levels/` в `prompts/levels/<levelId>/`.
- Runtime: потребуется перестроить чтение level prompts на путь, завязанный на `levelId`.
- Data model: `promptKey` можно убрать из level-конфига и из runtime-контракта уровня.
- Content governance: граница между “пользователь может увидеть” и “внутренняя prompt-логика” станет жёсткой и однозначной.
