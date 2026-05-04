import { getLevelOverview } from "@/lib/server"

type Params = { levelId: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { levelId } = await params
  const overview = await getLevelOverview(levelId)
  return Response.json({ ok: true, overview })
}
