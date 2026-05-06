import { redirect } from "next/navigation"

import { createTasksPath } from "@/lib/navigation"

export default function Page() {
  redirect(createTasksPath())
}
