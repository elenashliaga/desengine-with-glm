## Context

В runtime-коде и UI используется только `/api/tasks/:taskId/image` (включая `?imageId=...`).
Маршрут `/api/tasks/:taskId/images/:imageId` не имеет потребителей и повторяет ту же файловую логику.

## Decision

- Удалить `app/api/tasks/[taskId]/images/[imageId]/route.ts`.
- Не добавлять алиасы и thin-wrapper.
- Канонический путь для картинок задачи: `/api/tasks/:taskId/image`.

## Verification

- Проверить, что `route.ts` удалён.
- Проверить, что в кодовой базе нет runtime-обращений к `/api/tasks/:taskId/images/:imageId`.
