## Context

Сейчас onboarding-контент уровня организован непоследовательно:
- открытое описание уровня уже вынесено в `onboarding/levels/<levelId>/overview.md`;
- конфиг уровня хранится в `onboarding/levels/<levelId>/config.json`;
- скрытый `init-prompt.md` лежит там же, хотя по смыслу относится к невидимому prompt-контуру;
- prompt для уточняющего запроса уже хранится отдельно в `onboarding/prompts/levels/<promptKey>.md`.

Такое состояние делает файловую модель труднее для понимания:
- папка `levels/` перестаёт означать “только открытое содержимое уровня”;
- скрытая prompt-логика распределяется по двум разным корням;
- runtime вынужден держать дополнительный `promptKey`, хотя на самом деле prompt принадлежит самому уровню.

## Goals / Non-Goals

**Goals:**
- Сделать `onboarding/levels/<levelId>/` корнем только для открытых level-данных.
- Перенести все скрытые level prompts в `onboarding/prompts/levels/<levelId>/`.
- Упростить runtime-контракт и отказаться от отдельного `promptKey`.
- Зафиксировать устойчивую naming/model структуру для level prompts.

**Non-Goals:**
- Переработка task-level prompts за пределами уровневого контура.
- Изменение пользовательского текста уровней как такового.
- Вынесение production prompts из основного репозитория.

## Decisions

- `onboarding/levels/<levelId>/` хранит только открытое содержимое уровня.
  - Туда относятся `config.json`, `overview.md` и другие материалы, которые пользователь потенциально может увидеть в интерфейсе.
  - Скрытые prompt-материалы там больше не хранятся.

- Все hidden level prompts переносятся в `onboarding/prompts/levels/<levelId>/`.
  - Инициализирующий prompt уровня хранится в `onboarding/prompts/levels/<levelId>/init.md`.
  - Prompt уровня для уточняющего запроса хранится в `onboarding/prompts/levels/<levelId>/specify.md`.

- Runtime должен искать level prompts по `levelId`, а не по отдельному `promptKey`.
  - Если системе нужен hidden level prompt, она использует сам `levelId` как канонический идентификатор.
  - Дополнительный `promptKey` в `levels/<levelId>/config.json` больше не нужен.

- Визуально открытый и скрытый контур onboarding-контента должны быть различимы по одному только пути.
  - `levels/**` = потенциально открытое.
  - `prompts/**` = скрытое и служебное.

## Pre-Implementation Checklist

- Проинвентаризировать текущие level-файлы в `onboarding/levels/**`.
- Перенести `init-prompt.md` в новый hidden prompt layout.
- Переложить текущие level-specific prompts для уточняющего запроса из плоского `prompts/levels/*.md` в папки `prompts/levels/<levelId>/specify.md`.
- Проверить все runtime-чтения level prompts и убрать зависимость от `promptKey`.
- Проверить, что UI и публичные level-страницы продолжают читать только открытые level-материалы.

## Risks / Trade-offs

- [Переезд prompt-файлов] → можно сломать runtime-чтение уровневых prompts, если один путь не будет обновлён → нужен единый change для layout и чтения.
- [Удаление promptKey] → часть старого content/tooling может быть завязана на явный mapping → нужно проверить все места, где уровень сериализуется или валидируется.
- [Смешение открытого и скрытого контента в будущем] → если не закрепить правило в спеках, `levels/` снова начнёт обрастать скрытыми файлами → контракт должен явно запрещать hidden prompts внутри `levels/**`.
