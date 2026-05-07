import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { ACCESS_COOKIE_NAME, getAccessControlConfig, verifyAccessSessionValue } from "@/lib/access-control"
import { createAccessPreparePath } from "@/lib/navigation"

function isProtectedApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/access/")
}

function isProtectedPagePath(pathname: string): boolean {
  return pathname.startsWith("/lab")
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedApiPath(pathname) && !isProtectedPagePath(pathname)) {
    return NextResponse.next()
  }

  const { salt, isConfigured } = getAccessControlConfig()
  const cookieValue = request.cookies.get(ACCESS_COOKIE_NAME)?.value
  const verification = isConfigured
    ? await verifyAccessSessionValue(cookieValue, salt)
    : { status: "invalid" as const }
  const hasAccess = verification.status === "valid"

  if (hasAccess) {
    return NextResponse.next()
  }

  if (isProtectedApiPath(pathname)) {
    return NextResponse.json(
      { ok: false, error: "Доступ не разрешён. Сначала пройдите проверку по email." },
      { status: 401 },
    )
  }

  const redirectUrl = new URL(createAccessPreparePath(`${pathname}${search}`), request.url)

  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ["/lab/:path*", "/api/:path*"],
}
