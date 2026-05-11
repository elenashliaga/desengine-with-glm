import { readPublishedSnapshot } from "@/lib/server"

type Params = {
  snapshotId: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { snapshotId } = await params
  const snapshot = await readPublishedSnapshot(snapshotId)

  if (!snapshot) {
    return Response.json({ ok: false, error: "Слепок не найден" }, { status: 404 })
  }

  return Response.json(snapshot, {
    headers: {
      "Content-Disposition": `inline; filename="${snapshot.id}.json"`,
    },
  })
}
