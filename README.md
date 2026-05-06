# desengine

Локальная лаборатория для учебных React-задач с браузерным первым запуском и защищённым входом в рабочую часть через allowlist.

## Быстрый старт

1. Установите обычный `Node.js` вместе с `npm`.
2. Пройдите локальную установку по [INSTALL.md](/Users/op/dev/sobakapav/desengine/INSTALL.md:1).
3. Откройте [http://localhost:3000](http://localhost:3000).

До допуска по allowlist приложение показывает только страницу состояния системы. Даже без `OPENAI_API_KEY` оболочка откроется, но рабочие LLM-сценарии останутся недоступны.

Локальная конфигурация запуска хранится в `config.txt`, а шаблон лежит в `config-example.txt`.

## Пользовательский поток

- Пользователь открывает только браузер.
- На `/` приложение переводит его на `/tasks`.
- Если допуска ещё нет, защищённые маршруты переводят пользователя на `/auth`, где видны статусы системы и форма allowlist-проверки.
- После успешного допуска пользователь попадает обратно на целевой path: например, на `/tasks`, `/tasks/<taskId>` или `/levels/<levelId>`.
- На стартовой странице и внутри самой задачи доступен reset: он удаляет рабочие файлы и историю уточнений, после чего задача снова считается не начатой.
- На каждом уровне задача хранит только разрешённые рабочие файлы: запрещённые для текущего уровня файлы не принимаются из LLM-ответа и автоматически удаляются при `start` и `iterate`.

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
