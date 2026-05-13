## ADDED Requirements

### Requirement: API картинок задачи использует единый канонический endpoint

Система SHALL отдавать картинки задачи через единый endpoint `GET /api/tasks/:taskId/image` с параметром `imageId`.

#### Scenario: Клиент запрашивает картинку варианта
- **WHEN** клиент делает запрос `GET /api/tasks/:taskId/image?imageId=variants`
- **THEN** система возвращает соответствующую PNG-картинку

#### Scenario: Клиент пытается использовать удалённый дублирующий endpoint
- **WHEN** клиент делает запрос `GET /api/tasks/:taskId/images/:imageId`
- **THEN** система не предоставляет этот дублирующий endpoint
- **AND** каноническим остаётся только `GET /api/tasks/:taskId/image`
