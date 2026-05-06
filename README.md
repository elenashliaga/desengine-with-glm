# desengine

Локальная лаборатория для учебных React-задач с браузерным первым запуском и защищённым входом в рабочую часть через allowlist.

## Быстрый старт

1. Установите обычный `Node.js` вместе с `npm`.
2. Пройдите локальную установку по [INSTALL.md](/Users/op/dev/sobakapav/desengine/INSTALL.md:1).
3. Откройте [http://localhost:3000](http://localhost:3000).

До допуска по allowlist приложение показывает только страницу состояния системы. Даже без `OPENAI_API_KEY` оболочка откроется, но рабочие LLM-сценарии останутся недоступны.

Локальная конфигурация запуска хранится в `config.txt`, а шаблон лежит в `config-example.txt`.
Onboarding-контент runtime читает из каталога `/onboarding`, а адрес его внешнего репозитория задаётся через `DESENGINE_ONBOARDING_REPO_URL`.

## Пользовательский поток

- Пользователь открывает только браузер.
- На `/` приложение переводит его на `/tasks`.
- Если допуска ещё нет, защищённые маршруты переводят пользователя на `/auth`, где видны статусы системы и форма allowlist-проверки.
- После успешного допуска пользователь попадает обратно на целевой path: например, на `/tasks`, `/tasks/<taskId>` или `/levels/<levelId>`.
- На стартовой странице и внутри самой задачи доступен reset: он удаляет пользовательские рабочие файлы и историю уточнений из каталога `user/`, после чего задача снова считается не начатой.
- На каждом уровне задача хранит только разрешённые рабочие файлы: запрещённые для текущего уровня файлы не принимаются из LLM-ответа и автоматически удаляются при `start` и `iterate`.

## Project Data и User State

- Канонические onboarding-данные читаются из `/onboarding`: `levels/`, `tasks/**/{config.json,base.png,variants.png}`, `prompts/didactic/`.
- Корневые `levels/`, `tasks/` и `prompts/didactic/` больше не считаются runtime-источником onboarding-контента.
- Ручное обновление локального `/onboarding` выполняется через кнопку `Обновить onboarding` на `/config`.
- Весь локальный прогресс пользователя, рабочие файлы задач и prompt-history живут в `user/`.
- Обычное обновление проекта из Git не должно затрагивать `user/`.
- Полное удаление `user/` означает полный сброс пользовательской работы: приложение после этого просто начнёт заново и пересоздаст нужные файлы по мере работы.
- Пользовательский reset задачи удаляет её рабочее состояние из `user/` целиком.

## Админские команды

```bash
npm run build
npm run smoke
npm run allowlist:marker -- user@example.com
```

`npm run build` проверяет production-сборку. `npm run smoke` делает базовую preflight-проверку env и build.

## Документация

- Локальная установка: [INSTALL.md](/Users/op/dev/sobakapav/desengine/INSTALL.md:1)
- Настройка OpenAI: [env/openai.md](/Users/op/dev/sobakapav/desengine/env/openai.md:1)
- Настройка allowlist: [env/access-control.md](/Users/op/dev/sobakapav/desengine/env/access-control.md:1)
- Platform notes: [docs/platform-notes.md](/Users/op/dev/sobakapav/desengine/docs/platform-notes.md:1)
