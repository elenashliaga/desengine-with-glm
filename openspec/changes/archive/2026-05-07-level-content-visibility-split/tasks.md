## 1. Контракт структуры onboarding-уровня

- [x] 1.1 Обновить OpenSpec для явного разделения `levels/**` и `prompts/**`
- [x] 1.2 Зафиксировать, что `levels/<levelId>/` хранит только открытые level-данные
- [x] 1.3 Зафиксировать, что hidden level prompts живут только в `prompts/levels/<levelId>/`

## 2. Контракт prompt-layout

- [x] 2.1 Зафиксировать путь `onboarding/prompts/levels/<levelId>/init.md` для init prompt
- [x] 2.2 Зафиксировать путь `onboarding/prompts/levels/<levelId>/specify.md` для уточняющего prompt уровня
- [x] 2.3 Запретить хранение hidden prompt-файлов внутри `onboarding/levels/<levelId>/`

## 3. Упрощение модели уровня

- [x] 3.1 Убрать `promptKey` из контракта уровня
- [x] 3.2 Зафиксировать, что runtime определяет level prompts напрямую по `levelId`
- [x] 3.3 Проверить runtime, content tooling и валидацию уровня на совместимость с этой моделью

## 4. Миграция контента

- [x] 4.1 Перенести `init-prompt.md` из `onboarding/levels/**` в `onboarding/prompts/levels/<levelId>/init.md`
- [x] 4.2 Перенести level-specific уточняющие prompts в структуру `onboarding/prompts/levels/<levelId>/specify.md`
- [x] 4.3 Проверить, что в `onboarding/levels/**` остались только открытые материалы
