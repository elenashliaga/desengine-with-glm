# Onboarding репозиторий

## Purpose

Зафиксировать источник onboarding-репозитория и пользовательский поток ручного обновления onboarding-контента через `/config`.

## Requirements

### Requirement: Адрес onboarding-репозитория задаётся в desengine.config.txt

Система SHALL брать адрес внешнего onboarding-репозитория из `desengine.config.txt` через `ONBOARDING_REPO_URL` и использовать это значение как канонический источник как для первичной загрузки `/onboarding`, так и для последующих обновлений.

#### Scenario: Система определяет источник onboarding-контента
- **WHEN** системе нужен адрес внешнего onboarding-репозитория
- **THEN** она читает `ONBOARDING_REPO_URL` из `desengine.config.txt`
- **AND** использует это значение как канонический источник локального `/onboarding`

### Requirement: Onboarding-контент обновляется вручную с `/config`

Система SHALL предоставлять для `/onboarding` ручное обновление через действие `Обновить onboarding` на странице `/config` как явный способ повторной синхронизации после первичной установки или после смены `ONBOARDING_REPO_URL`.

#### Scenario: Пользователь хочет повторно обновить onboarding-контент
- **WHEN** пользователь открывает `/config`
- **THEN** система показывает действие `Обновить onboarding`
- **AND** обновление onboarding-контента запускается как повторная синхронизация с репозиторием из `ONBOARDING_REPO_URL`
