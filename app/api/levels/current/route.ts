import { requireAccessOrUnauthorizedResponse } from "@/lib/access/access-control.server"
import { getLevelOverview } from "@/lib/platform/server"

export async function GET() {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

  const overview = await getLevelOverview()
  return Response.json({ ok: true, overview })
}
