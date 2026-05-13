## 1. Marker-check и auth-исправление

- [x] 1.1 Изменить marker-check: при `HEAD != 200` делать fallback `GET`
- [x] 1.2 Обновить тесты marker-check под новый контракт
- [x] 1.3 Проверить, что ложный `403` для валидного email больше не воспроизводится по контракту

## 2. Унификация env-ключей

- [x] 2.1 Привести runtime-конфиг доступа к `DESENGINE_ALLOWLIST_*` (с fallback на legacy-имена)
- [x] 2.2 Привести onboarding-конфиг к `DESENGINE_ONBOARDING_REPO_URL` (с fallback, где применимо)
- [x] 2.3 Обновить пользовательские тексты в UI и server-ошибках

## 3. Документация и OpenSpec

- [x] 3.1 Обновить актуальную spec `access-control` под новый marker-check контракт
- [x] 3.2 Обновить `docs/access-control.md` с корректными env-именами и пояснением HEAD/GET fallback
- [x] 3.3 Оформить и сразу заархивировать ретро-change
