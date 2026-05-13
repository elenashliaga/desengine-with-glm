# Google Gemini API — локальная настройка

## Аудитория

- Администратор локальной установки.
- Инженер сопровождения, который настраивает активного LLM-провайдера.

Эта лаборатория использует общий LLM-слой. Google Gemini можно держать рядом с OpenAI и DeepSeek в одном `desengine.config.txt`, а активный провайдер выбирается через `DESENGINE_LLM_PROVIDER`.

Эта настройка относится к админскому контуру. Пользователь без ключа активного провайдера всё равно сможет открыть страницу состояния в браузере, но рабочие LLM-сценарии останутся недоступны.

## Обязательное

- `GEMINI_API_KEY` — ключ Gemini API из Google AI Studio.
- `DESENGINE_GEMINI_MODEL` — модель Google Gemini для всей лаборатории.

## Опциональное

- `DESENGINE_GEMINI_BASE_URL` — базовый URL Gemini API. По умолчанию используется `https://generativelanguage.googleapis.com/v1beta`.

## Как задать

Переименуй [desengine.config-example.txt](desengine.config-example.txt:1) в `desengine.config.txt` и укажи в нём Gemini как активный провайдер:

```env
DESENGINE_LLM_PROVIDER=gemini
GEMINI_API_KEY=...
DESENGINE_GEMINI_MODEL=gemini-2.5-flash
DESENGINE_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

Если OpenAI- и DeepSeek-конфиги тоже лежат рядом, они не конфликтуют с Gemini, пока активным остаётся `DESENGINE_LLM_PROVIDER=gemini`.

Текущая версия адаптера Gemini поддерживает те же входы лаборатории, что и другие сетевые адаптеры: текстовый запрос, изображения уровня и structured JSON-ответ.

Для доступа по email см. [access-control.md](docs/access-control.md).
Для onboarding-источника и ручного обновления см. [onboarding.md](docs/onboarding.md).
Админские команды сопровождения и smoke-check собраны в [tools/README.md](tools/README.md).
