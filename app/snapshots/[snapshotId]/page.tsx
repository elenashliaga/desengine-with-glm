import { notFound } from "next/navigation"

import { PublishedSnapshotView } from "@/components/desengine/PublishedSnapshotView"
import { readPublishedSnapshot } from "@/lib/server"

type Params = {
  snapshotId: string
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { snapshotId } = await params
  const snapshot = await readPublishedSnapshot(snapshotId)

  if (!snapshot) {
    notFound()
  }

  return <PublishedSnapshotView snapshot={snapshot} />
}
