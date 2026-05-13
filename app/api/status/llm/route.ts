import { getLlmStatus } from "@/lib/llm/llm.server"

export async function GET() {
  const status = await getLlmStatus()

  return Response.json({
    ok: true,
    ...status,
  })
}
