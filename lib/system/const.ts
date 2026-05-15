/** Системные константы и списки констант
  * 
  * В основном нужны для настройки типов.
  */

/** Статусы системных ресурсов */
const RESOURCE_STATES = [
  "ready",
  "warning",
  "blocked",
] as const

/** ID ресурсов системы */
const RESOURCE_IDS = [
  "local-config-file",
  "llm-config",
  "llm-network",
  "allowlist-config",
  "allowlist-network",
  "onboarding-config",
  "onboarding-content",
  "access-session",
] as const

/** Роли пользователей в системе */
const USER_ROLES = [
  "user",
  "admin",
] as const

/** ID LLM-провайдеров, к которым система может подключиться */
const LLM_PROVIDER_IDS = [
  "openai",
  "deepseek",
  "gemini",
] as const


export {
  RESOURCE_STATES,
  RESOURCE_IDS,
  USER_ROLES,
  LLM_PROVIDER_IDS,
}