# Обновление desengine

Этот документ описывает безопасное обновление уже установленной локальной инстанции desengine.

Документ покрывает два сценария:

1. **Обычное обновление Git-репозитория**, если проект изначально был установлен через `git clone`.
2. **Переход со скачанной архивом версии `v0.1.4` на `v0.1.5` через Git**, если проект изначально был скачан напрямую с GitHub как архив, а не клонирован через Git.

---

## Аудитория и роль

- **Администратор**: выполняет установку, обновление, проверку и диагностику.
- **Пользователь**: пользуется локальным сервером через браузер; browser-only поток остаётся прежним.

`INSTALL.md` отвечает за первый запуск, `UPDATE.md` — за последующие обновления.

---

## Что важно сохранить перед обновлением

Перед любыми действиями сохраните локальные данные и конфигурацию.

Главный файл локальной конфигурации:

```bash
desengine.config.txt
```

Его нельзя терять при обновлении.

Также не удаляйте пользовательское состояние:

```bash
user/
```

Границы данных:

- `desengine.config.txt` — локальная конфигурация сервера.
- `user/` — пользовательское состояние и прогресс; не удалять при обычном обновлении.
- `/onboarding` — учебный контент; обновляется отдельно через `/config` кнопкой `Обновить onboarding`.

---

# Сценарий 1. Обычное обновление, если проект уже установлен через Git

Используйте этот сценарий, если проект изначально был установлен командой:

```bash
git clone https://github.com/sobakapav/desengine.git
```

## 1. Перейдите в папку проекта

```bash
cd path/to/desengine
```

## 2. Сохраните конфиг

```bash
cp desengine.config.txt ../desengine.config.txt.backup
```

## 3. Получите свежие версии из GitHub

```bash
git fetch --tags
```

## 4. Обновитесь до нужного релиза

Например, до `v0.1.5`:

```bash
git checkout v0.1.5
```

Или, если вы работаете через ветку `main`:

```bash
git switch main
git pull
```

## 5. Верните локальный конфиг

```bash
cp ../desengine.config.txt.backup desengine.config.txt
```

## 6. Установите зависимости

```bash
npm install
```

## 7. Проверьте установку

```bash
npm run smoke
```

Если проверка успешна, можно запускать сервер:

```bash
npm run dev
```

Откройте в браузере:

```text
http://localhost:3000
```

---

# Сценарий 2. Обновление со скачанной архивом `v0.1.4` до `v0.1.5` через Git

Этот сценарий нужен, если вы сначала скачали проект с GitHub как архив, например `desengine-0.1.4`, а потом хотите обновляться через Git.

В этом случае **не используйте обычный `git merge v0.1.5`**.  
Архивная папка и Git-репозиторий имеют разные истории, поэтому merge может создать большое количество конфликтов.

Правильная логика:

```text
скачанная v0.1.4 → сохранить config → подключить Git → взять файлы v0.1.5 → вернуть config
```

## 1. Перейдите в папку старой версии

```bash
cd path/to/desengine-0.1.4
```

## 2. Сохраните локальный конфиг

```bash
cp desengine.config.txt ../desengine.config.txt.backup
```

## 3. Инициализируйте Git

```bash
git init
```

## 4. Подключите GitHub-репозиторий

Используйте HTTPS-адрес репозитория:

```bash
git remote add origin https://github.com/sobakapav/desengine.git
```

Если `origin` уже существует, замените его:

```bash
git remote set-url origin https://github.com/sobakapav/desengine.git
```

Проверьте remote:

```bash
git remote -v
```

Адрес должен выглядеть примерно так:

```text
origin  https://github.com/sobakapav/desengine.git (fetch)
origin  https://github.com/sobakapav/desengine.git (push)
```

Если адрес выглядит так:

```text
git@github.com:sobakapav/desengine.git
```

то Git будет использовать SSH. Без настроенного SSH-ключа появится ошибка:

```text
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

В таком случае замените remote на HTTPS:

```bash
git remote set-url origin https://github.com/sobakapav/desengine.git
```

## 5. Получите теги релизов

```bash
git fetch --tags
```

Проверьте, что тег `v0.1.5` доступен:

```bash
git tag
```

## 6. Зафиксируйте текущую архивную версию как локальный коммит

Это нужно, чтобы Git начал отслеживать файлы текущей папки:

```bash
git add .
git commit -m "Import local v0.1.4"
```

Если Git попросит указать имя и email, настройте их:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

После этого повторите коммит:

```bash
git commit -m "Import local v0.1.4"
```

## 7. Не делайте merge с `v0.1.5`

Не используйте:

```bash
git merge v0.1.5
```

Почему: архивная версия и настоящий Git-релиз могут выглядеть для Git как несвязанные истории.

Типичная ошибка:

```text
fatal: refusing to merge unrelated histories
```

Даже если запустить:

```bash
git merge v0.1.5 --allow-unrelated-histories
```

можно получить много конфликтов и файлы с маркерами:

```text
<<<<<<< HEAD
=======
>>>>>>> v0.1.5
```

Эти маркеры ломают `package.json`, TypeScript и сборку Next.js.

## 8. Накатите файлы `v0.1.5` поверх текущей папки

Используйте не merge, а checkout файлов из тега:

```bash
git checkout v0.1.5 -- .
```

Эта команда берёт содержимое релиза `v0.1.5` и кладёт его в текущую рабочую папку.

## 9. Верните локальный конфиг

```bash
cp ../desengine.config.txt.backup desengine.config.txt
```

Проверьте, что файл на месте:

```bash
cat desengine.config.txt
```

## 10. Зафиксируйте обновление

```bash
git add .
git commit -m "Update to v0.1.5 keeping local config"
```

## 11. Установите зависимости

```bash
npm install
```

Если после обновления сборка сообщает, что не найдены модули, например:

```text
Module not found: Can't resolve 'mermaid'
Module not found: Can't resolve 'remark-gfm'
```

то установите недостающие зависимости:

```bash
npm install mermaid remark-gfm
```

После этого зафиксируйте изменения:

```bash
git add package.json package-lock.json
git commit -m "Add missing markdown render dependencies"
```

## 12. Проверьте smoke-check

```bash
npm run smoke
```

Если всё хорошо, в конце не должно быть критических ошибок.

## 13. Запустите локальный сервер

```bash
npm run dev
```

Откройте:

```text
http://localhost:3000
```

---

# Альтернативный чистый способ: новая папка

Если в старой папке накопились конфликты, кеши или ошибки регистра файлов, проще сделать чистую установку.

## 1. Перейдите на уровень выше

```bash
cd ..
```

## 2. Сохраните конфиг

```bash
cp desengine-0.1.4/desengine.config.txt ./desengine.config.txt.backup
```

## 3. Переименуйте старую папку

```bash
mv desengine-0.1.4 desengine-0.1.4-backup
```

## 4. Склонируйте репозиторий заново

```bash
git clone https://github.com/sobakapav/desengine.git desengine
```

## 5. Перейдите в новую папку

```bash
cd desengine
```

## 6. Переключитесь на нужный релиз

```bash
git fetch --tags
git checkout v0.1.5
```

## 7. Верните конфиг

```bash
cp ../desengine.config.txt.backup ./desengine.config.txt
```

## 8. Установите зависимости и проверьте

```bash
npm install
npm run smoke
```

## 9. Запустите сервер

```bash
npm run dev
```

---

# Частые ошибки и решения

## Ошибка SSH-доступа к GitHub

Ошибка:

```text
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

Причина: Git пытается использовать SSH-адрес репозитория, но SSH-ключ не настроен.

Решение: используйте HTTPS remote.

```bash
git remote set-url origin https://github.com/sobakapav/desengine.git
git fetch --tags
```

## Git отказывается переключаться на релиз из-за untracked files

Ошибка:

```text
error: The following untracked working tree files would be overwritten by checkout
```

Причина: вы находитесь в папке, скачанной архивом, и Git ещё не отслеживает файлы.

Решение:

```bash
git add .
git commit -m "Import local version"
git checkout v0.1.5 -- .
```

Если папка уже сильно повреждена, используйте чистый способ через новую папку.

## Ошибка `fatal: refusing to merge unrelated histories`

Ошибка:

```text
fatal: refusing to merge unrelated histories
```

Причина: локальный коммит архивной версии и Git-релиз имеют разные истории.

Решение: не делайте merge. Используйте:

```bash
git checkout v0.1.5 -- .
```

## В файлах остались conflict markers

Признаки:

```text
<<<<<<< HEAD
=======
>>>>>>> v0.1.5
```

Такие маркеры могут ломать `package.json`, `.tsx`, `.ts`, `.md` и другие файлы.

Проверка:

```bash
grep -rn "<<<<<<<\|=======\|>>>>>>>" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next
```

Если таких файлов много, лучше не чинить вручную. Используйте чистое восстановление из тега:

```bash
cp desengine.config.txt ../desengine.config.txt.backup
git reset --hard <commit-before-bad-merge>
git clean -fdx
git checkout v0.1.5 -- .
cp ../desengine.config.txt.backup desengine.config.txt
npm install
npm run smoke
```

## `npm error EJSONPARSE`

Ошибка:

```text
npm error code EJSONPARSE
npm error JSON.parse Invalid package.json
```

Частая причина: в `package.json` остались merge-маркеры:

```text
<<<<<<< HEAD
=======
>>>>>>> v0.1.5
```

Решение: если конфликтов немного, исправьте `package.json` вручную. Если конфликтов много, восстановите файл из релиза:

```bash
git checkout v0.1.5 -- package.json package-lock.json
npm install
```

## `Module not found: Can't resolve 'mermaid'`

Ошибка:

```text
Module not found: Can't resolve 'mermaid'
```

или:

```text
Module not found: Can't resolve 'remark-gfm'
```

Решение:

```bash
npm install mermaid remark-gfm
npm run smoke
```

Если после этого всё работает:

```bash
git add package.json package-lock.json
git commit -m "Add missing markdown render dependencies"
```

## Ошибка регистра папки `Lab` / `lab` на macOS

Ошибка:

```text
File name '.../components/desengine/lab/LabScreen/index.ts'
differs from already included file name
'.../components/desengine/Lab/LabScreen/index.ts'
only in casing.
```

Причина: в файловой системе папка называется `Lab`, а код импортирует `lab`, или наоборот.

Проверка:

```bash
ls -la components/desengine
find components/desengine -maxdepth 3 -iname "LabScreen" -print
```

Если папка называется `Lab`, а импорты используют `lab`, переименуйте через временное имя:

```bash
mv components/desengine/Lab components/desengine/lab_tmp
mv components/desengine/lab_tmp components/desengine/lab
```

Очистите кеши:

```bash
rm -rf .next
rm -rf node_modules/.cache
find . -name "*.tsbuildinfo" -delete
```

Проверьте снова:

```bash
npm run smoke
```

Если Git должен зафиксировать изменение регистра:

```bash
git add -A
git commit -m "Fix lab folder casing"
```

## Предупреждение Turbopack про `next.config.ts`

Smoke-check может показать warning:

```text
Encountered unexpected file in NFT list
```

Если при этом нет build/type errors, это предупреждение не обязательно блокирует локальный запуск.

Если есть другие ошибки после этого блока, исправляйте именно их.

---

# Проверка после обновления

После успешного обновления проверьте:

1. Smoke-check проходит:

```bash
npm run smoke
```

2. Локальный сервер запускается:

```bash
npm run dev
```

3. Открывается главная страница:

```text
http://localhost:3000
```

4. Страница авторизации работает:

```text
http://localhost:3000/auth
```

5. После авторизации доступен список задач:

```text
http://localhost:3000/tasks
```

6. Страница конфигурации открывается:

```text
http://localhost:3000/config
```

Если onboarding неполон, `/config` должен явно показать проблему и позволить ручное обновление.

---

# Что обновление не должно делать

- Не удаляйте `user/` при обычном обновлении.
- Не удаляйте `desengine.config.txt`.
- Не подменяйте обновление onboarding-контента обычным обновлением основного Git-репозитория.
- Не используйте `git merge v0.1.5` для папки, которая изначально была скачана архивом.
- Не используйте `git checkout -f` и `git clean -fdx`, пока не сохранили `desengine.config.txt`.

---

# Рекомендуемые команды для будущих обновлений

Если проект уже переведён на Git и нужно обновиться до следующего релиза, например `v0.1.6`:

```bash
cp desengine.config.txt ../desengine.config.txt.backup

git fetch --tags
git checkout v0.1.6 -- .

cp ../desengine.config.txt.backup desengine.config.txt

npm install
npm run smoke
```

Если smoke-check успешен:

```bash
git add .
git commit -m "Update to v0.1.6 keeping local config"
```

---

# Проверка согласованности документации

Локально можно быстро проверить, что root-документы ссылаются на сценарий обновления:

```bash
rg -n "UPDATE\.md" README.md INSTALL.md INSTALL-USER.md tools/README.md docs/*.md
```

---

# Связанные документы

- [README.md](README.md) — карта документации и контуров.
- [INSTALL.md](INSTALL.md) — первая установка.
- [INSTALL-USER.md](INSTALL-USER.md) — упрощённая инструкция установки для неопытного пользователя.
- [docs/onboarding.md](docs/onboarding.md) — контракт `/onboarding` и ручное обновление.
- [docs/access-control.md](docs/access-control.md) — allowlist-контур.
- [tools/README.md](tools/README.md) — канонические админские команды.
