import { getLevelOverview } from "@/lib/platform/server"

export async function GET() {
  const overview = await getLevelOverview()
  return Response.json({ ok: true, overview })
}
