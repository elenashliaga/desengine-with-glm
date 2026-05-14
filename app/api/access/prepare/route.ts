import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { shouldUseSecureCookies } from "@/lib/access/control"
import { ACCESS_RETURN_PATH_COOKIE_NAME } from "@/lib/access/server"
import { createAuthPath, sanitizeReturnPath } from "@/lib/platform/navigation"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = sanitizeReturnPath(url.searchParams.get("returnTo"))
  const cookieStore = await cookies()

  if (!returnTo) {
    cookieStore.delete(ACCESS_RETURN_PATH_COOKIE_NAME)
    return NextResponse.redirect(new URL(createAuthPath(), url))
  }

  cookieStore.set(ACCESS_RETURN_PATH_COOKIE_NAME, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request.url),
    path: "/",
  })

  return NextResponse.redirect(new URL(createAuthPath(), url))
}
