import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { shouldUseSecureCookies } from "@/lib/auth/control"
import { ACCESS_RETURN_PATH_COOKIE_NAME } from "@/lib/auth/server"
import { getAuthUrl, sanitizeReturnPath } from "@/lib/auth/navigation"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = sanitizeReturnPath(url.searchParams.get("returnTo"))
  const cookieStore = await cookies()

  if (!returnTo) {
    cookieStore.delete(ACCESS_RETURN_PATH_COOKIE_NAME)
    return NextResponse.redirect(new URL(getAuthUrl(), url))
  }

  cookieStore.set(ACCESS_RETURN_PATH_COOKIE_NAME, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request.url),
    path: "/",
  })

  return NextResponse.redirect(new URL(getAuthUrl(), url))
}
