# Allowlist-доступ — локальная настройка

Эта лаборатория проверяет доступ по email через удалённое статическое allowlist-хранилище.

Это админская настройка. Пользователь до допуска видит только страницу состояния системы и не получает доступ к задачам, пока его email не подтверждён через allowlist.

## Обязательное

- `DESENGINE_ALLOWLIST_BASE_URL` — базовый URL, по которому приложение ищет allowlist-маркеры.
- `DESENGINE_ALLOWLIST_SALT` — salt для вычисления `sha256(normalizedEmail + ":" + salt)`.

## Как задать

Переименуй [config-example.txt](/Users/op/dev/sobakapav/desengine/config-example.txt:1) в `config.txt` и проверь значения блока доступа по email:

```bash
DESENGINE_ALLOWLIST_BASE_URL=https://example.com/allowlist/
DESENGINE_ALLOWLIST_SALT=replace-with-random-secret
```

Оба значения уже предзаполнены в шаблоне. Для локального знакомства этого достаточно, а для рабочего окружения salt нужно заменить на реальный секрет.

## Как это работает

1. Пользователь вводит email.
2. Приложение нормализует его: `trim` + `lowercase`.
3. Приложение вычисляет хэш `sha256(normalizedEmail + ":" + salt)`.
4. Приложение проверяет наличие файла по адресу `<baseUrl>/<hash>`.
5. `200` означает допуск, `404` означает отказ.

Если allowlist ещё не настроен, приложение не ломается: оно показывает страницу состояния и объясняет, что именно должен доделать администратор.

Удалённый allowlist-хостинг не выполняет бизнес-логики: он только отдаёт или не отдаёт статический файл-маркер.

## Формат allowlist-хранилища

Хранилище может быть любым статическим хостингом: S3 bucket с website hosting, CDN-backed directory, nginx с папкой файлов, GitHub Pages и т.п.

Минимальный формат:

```text
allowlist/
  9d4c...f2
  a173...0b
  c91e...71
```

Где каждое имя файла:
- это hex-строка `sha256(normalizedEmail + ":" + salt)`;
- соответствует одному разрешённому email;
- может быть пустым файлом: содержимое не важно, важно только существование ресурса.

## Как добавить новый email в allowlist

1. Нормализуй email: убери пробелы по краям и переведи в lowercase.
2. Сгенерируй имя маркера:

```bash
DESENGINE_ALLOWLIST_SALT=... npm run allowlist:marker -- user@example.com
```

Или:

```bash
node tools/generate-allowlist-marker.mjs user@example.com --salt=...
```

3. Создай на статическом хостинге пустой файл с этим именем.
4. Убедись, что URL `<DESENGINE_ALLOWLIST_BASE_URL>/<marker>` возвращает `200`.

## Как удалить email из allowlist

1. Сгенерируй то же имя маркера для email.
2. Удали одноимённый файл из статического хранилища.
3. Убедись, что URL `<DESENGINE_ALLOWLIST_BASE_URL>/<marker>` возвращает `404`.
