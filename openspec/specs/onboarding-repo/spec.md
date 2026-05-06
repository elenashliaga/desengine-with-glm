# Onboarding-репозиторий

## Purpose

Зафиксировать отдельный внешний источник правды для onboarding-контента продукта и его локальное использование через каталог `/onboarding`.

## Requirements

### Requirement: Onboarding-контент хранится в отдельном репозитории

Система SHALL рассматривать отдельный onboarding-репозиторий как источник правды для onboarding-слоя продукта.

#### Scenario: Система определяет источник onboarding-контента
- **WHEN** системе нужно понять, откуда брать onboarding-данные
- **THEN** каноническим источником считается отдельный onboarding-репозиторий

### Requirement: Адрес onboarding-репозитория задаётся в config.txt

Система SHALL брать адрес внешнего onboarding-репозитория из `config.txt` через `DESENGINE_ONBOARDING_REPO_URL`.

#### Scenario: Система определяет источник onboarding-контента
- **WHEN** системе нужен адрес внешнего onboarding-репозитория
- **THEN** она читает `DESENGINE_ONBOARDING_REPO_URL` из `config.txt`

### Requirement: Onboarding-контент собирается под единым корнем `/onboarding`

Система SHALL трактовать `/onboarding` как единый внешний корень onboarding-слоя.

#### Scenario: Система маппит внешний onboarding-контент в локальную структуру
- **WHEN** система работает с onboarding-слоем
- **THEN** она видит его как единый корень `/onboarding`

### Requirement: В onboarding-репозиторий входят уровни, задачи и didactic-prompts

Система SHALL относить к onboarding-репозиторию:
- `onboarding/levels/**`
- `onboarding/tasks/**/config.json`
- `onboarding/tasks/**/base.png`
- `onboarding/tasks/**/variants.png`
- `onboarding/prompts/didactic/**`

#### Scenario: Система читает onboarding-уровень
- **WHEN** системе нужны уровни и их onboarding-материалы
- **THEN** она рассматривает onboarding-репозиторий как источник этих данных

#### Scenario: Система читает onboarding-описание задачи
- **WHEN** системе нужны `config.json`, `base.png` или `variants.png` задачи
- **THEN** она рассматривает onboarding-репозиторий как источник этих данных

#### Scenario: Система читает didactic-промпт
- **WHEN** системе нужен didactic-промпт уровня или сценария
- **THEN** она рассматривает onboarding-репозиторий как источник этого промпта

### Requirement: Production-prompts не входят в onboarding-репозиторий

Система SHALL не относить `prompts/production/**` к onboarding-репозиторию.

#### Scenario: Система читает production-промпт
- **WHEN** runtime нужен production-промпт
- **THEN** она читает его из основного репозитория, а не из onboarding-репозитория

### Requirement: Legacy-рабочие файлы не входят в onboarding-контент

Система SHALL не считать рабочие исходники компонента и историю уточнений частью onboarding-репозитория.

#### Scenario: Система определяет состав versioned onboarding-контента задачи
- **WHEN** рядом с `onboarding/tasks/**` появляются `Component.tsx`, `Component.stories.*`, `styles.ts`, `mock.ts`, `props.ts` или `prompt-history.json`
- **THEN** они не считаются частью onboarding-контента
- **AND** трактуются как legacy-артефакты, подлежащие удалению из versioned task-каталога

### Requirement: `/onboarding` обязателен без fallback к старым корневым каталогам

Система SHALL читать onboarding-данные только из `/onboarding` и не использовать старые корневые каталоги как тихий запасной источник.

#### Scenario: В старых корневых каталогах ещё лежат onboarding-файлы
- **WHEN** рядом с `/onboarding` в корне репозитория всё ещё существуют `levels/**`, `tasks/**` или `prompts/didactic/**`
- **THEN** система не использует их как runtime-источник onboarding-данных
- **AND** такие legacy-каталоги должны быть удалены из репозитория

### Requirement: Недоступность onboarding-контента показывается явно

Система SHALL при недоступности onboarding-контента запускаться с явным статусом проблемы, а не молча считать это нормальным состоянием.

#### Scenario: Onboarding-репозиторий не подгрузился
- **WHEN** `/onboarding` недоступен, отсутствует или неполон
- **THEN** система всё равно запускается
- **AND** явно показывает статус или ошибку о недоступности onboarding-контента

### Requirement: Onboarding-контент обновляется вручную с `/config`

Система SHALL предоставлять для `/onboarding` только ручное обновление через действие `Обновить onboarding` на странице `/config`.

#### Scenario: Пользователь хочет обновить onboarding-контент
- **WHEN** пользователь открывает `/config`
- **THEN** система показывает действие `Обновить onboarding`
- **AND** обновление onboarding-контента запускается только через это действие
