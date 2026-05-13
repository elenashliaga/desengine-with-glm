# desengine

Локальная лаборатория для учебных React-задач с браузерным первым запуском и защищённым входом в рабочую часть через allowlist.

## Для кого этот файл

- Пользователь: понять, какие страницы есть в системе и как выглядит browser-only сценарий.
- Администратор: понять, какие документы читать для локального запуска, доступа, onboarding-контента и служебных команд.

## Быстрый старт

1. Установите обычный `Node.js` вместе с `npm`.
2. Пройдите локальную установку по [INSTALL.md](INSTALL.md).
3. Откройте [http://localhost:3000](http://localhost:3000).

До допуска по allowlist корневой маршрут `/` показывает страницу состояния системы и следующие шаги. Даже без `OPENAI_API_KEY` оболочка откроется, но рабочие LLM-сценарии останутся недоступны.

Локальная конфигурация запуска хранится в `desengine.config.txt`, а шаблон лежит в `desengine.config-example.txt`.
Onboarding-контент runtime читает из каталога `/onboarding`, а его канонический внешний источник задаётся через `ONBOARDING_REPO_URL`.

## Пользовательский контур

- Пользователь открывает только браузер и не выполняет `npm run ...` команды.
- На `/` пользователь видит статусную страницу с основными entry points.
- Если допуска ещё нет, переход на защищённые маршруты переводит пользователя на `/auth`, где видны статусы системы и форма allowlist-проверки.
- После успешного допуска пользователь попадает обратно на целевой path: например, на `/tasks`, `/tasks/<taskId>` или `/levels/<levelId>`.
- Страница `/help` кратко объясняет пользовательские точки входа: `/auth`, `/tasks`, `/levels`, `/config`.
- На стартовой странице и внутри самой задачи доступен reset: он удаляет пользовательские рабочие файлы и историю уточнений из каталога `user/`, после чего задача снова считается не начатой.
- На каждом уровне задача хранит только разрешённые рабочие файлы: запрещённые для текущего уровня файлы не принимаются из LLM-ответа и автоматически удаляются при `start` и `iterate`.

## Административный контур

- Администратор поднимает локальное приложение, настраивает `desengine.config.txt`, LLM-провайдера, allowlist и onboarding-источник.
- Администратор отвечает за здоровье базового URL allowlist-хранилища, за наличие email-маркеров и за доступность `/onboarding`.
- Администратор может вручную обновить локальный `/onboarding` через кнопку `Обновить onboarding` на `/config`.
- Канонические служебные команды и утилиты собраны в [tools/README.md](tools/README.md).

## Project Data и User State

- Канонические onboarding-данные читаются из `/onboarding`: `onboarding/levels/**`, `onboarding/tasks/**/{config.json,base.png,variants.png}`, `onboarding/prompts/**`.
- Открытые пользовательские пояснения хранятся в Markdown: общий текст уровня лежит в `onboarding/levels/<levelId>/overview.md`, а task-specific пояснение уровня — в `onboarding/tasks/<taskId>/levels/<levelId>/tip.md`.
- Эти Markdown-файлы рендерятся в UI как Markdown и не должны использоваться для hidden prompt-логики.
- Корневые `levels/`, `tasks/` и старые вложенные пути промптов не должны использоваться и подлежат удалению как legacy-каталоги.
- Ручное обновление локального `/onboarding` выполняется через кнопку `Обновить onboarding` на `/config`, а канонический URL репозитория задаётся в `ONBOARDING_REPO_URL`.
- Весь локальный прогресс пользователя, рабочие файлы задач и prompt-history живут в `user/`.
- Обычное обновление проекта из Git не должно затрагивать `user/`.
- Полное удаление `user/` означает полный сброс пользовательской работы: приложение после этого просто начнёт заново и пересоздаст нужные файлы по мере работы.
- Пользовательский reset задачи удаляет её рабочее состояние из `user/` целиком.

## Админские команды

```bash
npm run build
npm run smoke
npm run allowlist:marker -- user@example.com
npm run admin:tasks:configs
npm run admin:tasks:import -- --variants-root=... --base-root=...
```

`npm run build` проверяет production-сборку. `npm run smoke` делает базовую preflight-проверку env и build. Полный канонический каталог админских утилит и команд собран в [tools/README.md](tools/README.md).

## Документация

- [INSTALL.md](INSTALL.md) — каноническая пошаговая инструкция локальной установки для администратора.
- [docs/access-control.md](docs/access-control.md) — allowlist-контур: базовый URL, marker-check и допуск по email.
- [docs/onboarding.md](docs/onboarding.md) — канонический источник onboarding-контента и ручное обновление `/onboarding`.
- [docs/openai.md](docs/openai.md) — настройка OpenAI как активного LLM-провайдера.
- [docs/deepseek.md](docs/deepseek.md) — настройка DeepSeek как активного LLM-провайдера.
- [docs/gemini.md](docs/gemini.md) — настройка Gemini как активного LLM-провайдера.
- [docs/platform-notes.md](docs/platform-notes.md) — platform-specific примечания и общие ограничения по среде.
- [tools/README.md](tools/README.md) — канонический каталог административных утилит и `npm run ...` команд.
- [docs/release-notes-2026-05-07.md](docs/release-notes-2026-05-07.md) — исторические release notes, а не инструкция первого запуска.
