# Admin Tools

## Аудитория

- Администратор локальной установки.
- Инженер сопровождения.

Browser-only пользователь не должен проходить по этому документу для обычной работы с лабораторией.

Канонический каталог админских утилит проекта — `/tools`.

Этот каталог фиксирует:
- инвентаризацию официальных admin tools;
- канонические `npm run ...` команды для их запуска;
- карту миграции со старых путей;
- правила для служебных сценариев сопровождения.

## Инвентаризация

Сейчас к каноническому админскому контуру относятся:

| Назначение | Канонический файл | Каноническая команда |
| --- | --- | --- |
| Smoke-check локальной установки | `tools/smoke-local-install.mjs` | `npm run smoke` |
| Краткая сводка актуальных OpenSpec changes | `tools/list-active-openspec-changes.mjs` | `npm run openspec` |
| Создание нового OpenSpec change с `short` в metadata | `tools/create-openspec-change.mjs` | `npm run openspec:new -- <name>` |
| Генерация allowlist-маркера | `tools/generate-allowlist-marker.mjs` | `npm run allowlist:marker -- user@example.com` |
| Генерация `config.json` по `base.png` и `variants.png` | `tools/generate-task-configs.mjs` | `npm run admin:tasks:configs` |
| Подготовка task-каталогов из набора PNG | `tools/import-task-assets.mjs` | `npm run admin:tasks:import -- --variants-root=... --base-root=...` |

Каноническими не считаются:
- ad hoc shell-фрагменты;
- machine-specific скрипты с абсолютными путями;
- запуск JS-утилит прямым путём как официальная инструкция, если для них уже есть `npm run ...`.

## Карта миграции

| Старый путь | Новый путь | Каноническая команда |
| --- | --- | --- |
| `scripts/smoke-local-install.mjs` | `tools/smoke-local-install.mjs` | `npm run smoke` |
| `tools/generate-allowlist-marker.mjs` | `tools/generate-allowlist-marker.mjs` | `npm run allowlist:marker -- user@example.com` |
| `utils/config.sh` | `tools/generate-task-configs.mjs` | `npm run admin:tasks:configs` |
| `utils/generate_task_folders.sh` | `tools/import-task-assets.mjs` | `npm run admin:tasks:import -- --variants-root=... --base-root=...` |

## Канонические команды

Этот файл фиксирует только CLI-утилиты из `/tools`. Ручное обновление локального `/onboarding` через кнопку `Обновить onboarding` на `/config` относится к административному контуру, но не считается CLI-admin-tool из `/tools`. Подробности по этому потоку собраны в [docs/onboarding.md](docs/onboarding.md).

### `npm run smoke`

Проверяет:
- версию Node.js;
- наличие `desengine.config.txt`;
- отсутствие устаревшего `.env.local`;
- базовую конфигурацию `OPENAI_API_KEY` и allowlist;
- production build проекта.

### `npm run openspec`

Печатает все актуальные OpenSpec changes, исключая:
- archived changes из `openspec/changes/archive`;
- changes со статусом `Suspended`.

Для короткой аннотации скрипт сначала читает поле `short` из `openspec/changes/<change>/.openspec.yaml`.
Если `short` не задан или metadata-файла нет, используется fallback на сокращённый текст из секции `Why` в `proposal.md`.

Формат вывода:

```bash
<change-name> — <короткое пояснение из секции Why>
```

### `npm run openspec:new -- <name>`

Создаёт новый OpenSpec change через штатный `openspec new change`, а затем гарантирует, что в `openspec/changes/<name>/.openspec.yaml` есть поле:

```yaml
short: ""
```

Примеры:

```bash
npm run openspec:new -- add-level-badges
npm run openspec:new -- add-level-badges --schema spec-driven
npm run openspec:new -- add-level-badges --description "Пробный change"
```

### `npm run allowlist:marker -- user@example.com`

Печатает hex-маркер для allowlist по email и `DESENGINE_ALLOWLIST_SALT`.

Дополнительно можно явно передать salt:

```bash
npm run allowlist:marker -- user@example.com --salt=my-secret-salt
```

### `npm run admin:tasks:configs`

Пересобирает `config.json` для всех задач в `onboarding/tasks` по размерам `base.png` и `variants.png`.

Полезные аргументы:

```bash
npm run admin:tasks:configs -- --tasks-root=tasks
npm run admin:tasks:configs -- --tasks-root=onboarding/tasks --max-level=20
```

### `npm run admin:tasks:import -- --variants-root=... --base-root=...`

Создаёт или обновляет task-каталоги и раскладывает туда:
- `variants.png` из каталога variants;
- `base.png` из каталога base по маске `<task-name>-base.png`.

Пример:

```bash
npm run admin:tasks:import -- --variants-root=incoming/variants --base-root=incoming/base --output-root=onboarding/tasks
```

## Правила admin tools

- Канонические admin tools должны жить только в `/tools`.
- Канонические инструкции по ним тоже должны жить в `/tools`.
- Официальный способ запуска admin tools — через `npm run ...`.
- Bash-скрипты не считаются официальным entry point для админского контура.
- Утилиты админского контура не должны зависеть от абсолютных путей конкретной машины.
- Root-документы и профильные docs могут ссылаться на эти команды, но не должны переопределять их форму.
