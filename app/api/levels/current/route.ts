import { getLevelOverview } from "@/lib/server"

export async function GET() {
  const overview = await getLevelOverview()
  return Response.json({ ok: true, overview })
}
