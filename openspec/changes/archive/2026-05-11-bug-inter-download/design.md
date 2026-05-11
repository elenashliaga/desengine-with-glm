## Context

Изначально в `app/layout.tsx` Inter подключался через `next/font/google`. Для локальной разработки это работало корректно, но на проблемном build-прогоне Turbopack не смог скачать файлы Inter с `fonts.gstatic.com` и затем упал на внутреннем модуле `@vercel/turbopack-next/internal/font/google/font`.

Принятое решение для этого change: не оставлять production build зависимым от внешней сети и перевести canonical поставку Inter на локальные `.woff2` assets в репозитории с подключением через `next/font/local`.

## Goals / Non-Goals

**Goals:**
- Сохранить Inter как UI-шрифт продукта.
- Сохранить подключение шрифта в стиле проекта и Tailwind-слоя.
- Сделать production build устойчивым при недоступности внешних font assets.
- Убрать зависимость сборки от `fonts.gstatic.com`.

**Non-Goals:**
- Заменять Inter на системный fallback.
- Переводить шрифтовую основу на другой дизайн-язык.
- Менять Turbopack, Next.js или install-critical инфраструктуру без отдельного явного решения.

## Chosen Direction

- Хранить файлы Inter в репозитории как локальные assets.
- Подключать их через `next/font/local` из `app/layout.tsx`.
- Сохранить переменную `--font-ui` и существующий fallback-список без смены базового шрифта.
- Добавить OpenSpec-дельту, которая фиксирует offline-контракт для production build.

## Risks / Trade-offs

- [Локальный Inter] → build становится устойчивее, но репозиторий начинает хранить бинарные font assets.
- [Лицензирование] → решение допустимо только при сохранении лицензии Inter рядом с локальными файлами.
- [Инфраструктурные изменения] → change осознанно не трогает Next.js, Turbopack и install-critical настройки.
