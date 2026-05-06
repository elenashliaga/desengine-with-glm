import { redirect } from "next/navigation"

import { createLevelsPath } from "@/lib/navigation"

export default function LegacyLevelsPage() {
  redirect(createLevelsPath())
}
