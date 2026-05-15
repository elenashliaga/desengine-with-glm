/** Система и её ресурсы */

import {
  RESOURCE_STATES,
  RESOURCE_IDS,
  USER_ROLES,
  LLM_PROVIDER_IDS,
} from "./const"

/** Cтатус системного ресурса */
type ResourceState =
  (typeof RESOURCE_STATES)[number]

/** ID системного ресурса */
type ResourceId =
  (typeof RESOURCE_IDS)[number]

/** Системный ресурс */
type Resource = {
  id: ResourceId
  label: string
  state: ResourceState
  summary: string
  detail: string
}

/** Роль пользователя в системе */
type UserRole = 
  (typeof USER_ROLES)[number]

/** Инструкция */
// ? Может, в help?
type Instruction = {
  id: string
  actor: UserRole
  text: string
}

/** ID LLM-провайдера */
type LlmProviderId = 
  (typeof LLM_PROVIDER_IDS)[number]


export type {
  ResourceState,
  ResourceId,
  Resource,
  UserRole,
  Instruction,
  LlmProviderId,
}