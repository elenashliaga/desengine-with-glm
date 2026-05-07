## 1. Контракт структуры onboarding-уровня

- [ ] 1.1 Обновить OpenSpec для явного разделения `levels/**` и `prompts/**`
- [ ] 1.2 Зафиксировать, что `levels/<levelId>/` хранит только открытые level-данные
- [ ] 1.3 Зафиксировать, что hidden level prompts живут только в `prompts/levels/<levelId>/`

## 2. Контракт prompt-layout

- [ ] 2.1 Зафиксировать путь `onboarding/prompts/levels/<levelId>/init.md` для init prompt
- [ ] 2.2 Зафиксировать путь `onboarding/prompts/levels/<levelId>/didactic.md` для didactic prompt
- [ ] 2.3 Запретить хранение hidden prompt-файлов внутри `onboarding/levels/<levelId>/`

## 3. Упрощение модели уровня

- [ ] 3.1 Убрать `promptKey` из контракта уровня
- [ ] 3.2 Зафиксировать, что runtime определяет level prompts напрямую по `levelId`
- [ ] 3.3 Проверить runtime, content tooling и валидацию уровня на совместимость с этой моделью

## 4. Миграция контента

- [ ] 4.1 Перенести `init-prompt.md` из `onboarding/levels/**` в `onboarding/prompts/levels/<levelId>/init.md`
- [ ] 4.2 Перенести didactic prompts в структуру `onboarding/prompts/levels/<levelId>/didactic.md`
- [ ] 4.3 Проверить, что в `onboarding/levels/**` остались только открытые материалы
