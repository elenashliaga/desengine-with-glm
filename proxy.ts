import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { ACCESS_COOKIE_NAME, getAccessControlConfig, verifyAccessSessionValue } from "@/lib/auth/control"

function isProtectedApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedApiPath(pathname)) {
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

  return NextResponse.json(
    { ok: false, error: "Доступ не разрешён. Сначала пройдите проверку по email." },
    { status: 401 },
  )
}

export const config = {
  matcher: ["/api/:path*"],
}
