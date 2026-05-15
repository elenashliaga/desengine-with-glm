import { getLlmStatus } from "../llm/server"
import { Instruction, Resource } from "../system/types"

type SystemStatusModel = {
  llmStatus: Awaited<ReturnType<typeof getLlmStatus>>
  items: Resource[]
  instructions: Instruction[]
  allowlistConfigured: boolean
  authState: "valid" | "missing" | "expired"
  hasAccess: boolean
  onboardingRepoConfigured: boolean
  onboardingSyncState: "missing" | "unconfirmed" | "synced"
  readyForProtectedLab: boolean
}


export {
  SystemStatusModel
}