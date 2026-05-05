import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { ACCESS_COOKIE_NAME, getAccessControlConfig, verifyAccessSessionValue } from "@/lib/access-control"

function isProtectedApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/access/")
}

function isProtectedPagePath(pathname: string): boolean {
  return pathname.startsWith("/lab") || pathname.startsWith("/pre")
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedApiPath(pathname) && !isProtectedPagePath(pathname)) {
    return NextResponse.next()
  }

  const { salt, isConfigured } = getAccessControlConfig()
  const cookieValue = request.cookies.get(ACCESS_COOKIE_NAME)?.value
  const hasAccess = isConfigured && (await verifyAccessSessionValue(cookieValue, salt))

  if (hasAccess) {
    return NextResponse.next()
  }

  if (isProtectedApiPath(pathname)) {
    return NextResponse.json(
      { ok: false, error: "Доступ не разрешён. Сначала пройдите проверку по email." },
      { status: 401 },
    )
  }

  const redirectUrl = new URL("/", request.url)
  redirectUrl.searchParams.set("next", `${pathname}${search}`)

  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ["/lab/:path*", "/pre/:path*", "/api/:path*"],
}
