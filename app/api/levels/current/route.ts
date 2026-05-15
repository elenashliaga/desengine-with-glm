import { requireAccessOrUnauthorizedResponse } from "@/lib/auth/server"
import { getLevelOverview } from "@/lib/system/server"

export async function GET() {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

  const overview = await getLevelOverview()
  return Response.json({ ok: true, overview })
}
