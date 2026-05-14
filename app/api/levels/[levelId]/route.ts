import { requireAccessOrUnauthorizedResponse } from "@/lib/access/server"
import { getLevelOverview } from "@/lib/platform/server"

type Params = { levelId: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

  const { levelId } = await params
  const overview = await getLevelOverview(levelId)
  return Response.json({ ok: true, overview })
}
