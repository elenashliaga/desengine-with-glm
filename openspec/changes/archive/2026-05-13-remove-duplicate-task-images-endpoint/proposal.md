## Why

В текущем API задач есть два маршрута для отдачи картинок:
- `/api/tasks/:taskId/image` (используется),
- `/api/tasks/:taskId/images/:imageId` (не используется).

Второй маршрут дублирует функциональность первого и только усложняет контракт.

## What Changes

- Удалить маршрут `GET /api/tasks/:taskId/images/:imageId`.
- Оставить единым каноническим маршрутом выдачи картинок `GET /api/tasks/:taskId/image` с параметром `imageId`.
