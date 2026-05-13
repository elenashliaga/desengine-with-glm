const ACCESS_COOKIE_NAME = "desengine-access"

const ACCESS_ALLOWED_PAYLOAD = "allowlist-access-granted"
const ACCESS_SESSION_TTL_MS = 24 * 60 * 60 * 1000

const ALLOWLIST_BASE_URL_ENV = "ALLOWLIST_BASE_URL"
const ALLOWLIST_SALT_ENV = "ALLOWLIST_SALT"

type AccessSessionPayload = {
  access?: string
  email?: string
  grantedAt?: string
  v?: number
}

type VerifiedAccessSession =
  | {
      status: "valid"
      payload: {
        access: string
        email: string
        grantedAt: string
        v: number
      }
    }
  | {
      status: "expired"
      payload: {
        access: string
        email: string
        grantedAt: string
        v: number
      }
    }
  | {
      status: "invalid"
    }

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(value: string): Uint8Array | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")

  try {
    const binary = atob(padded)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

function getAccessControlConfig() {
  const baseUrl =
    process.env[ALLOWLIST_BASE_URL_ENV]?.trim()
    || process.env.DESENGINE_ALLOWLIST_BASE_URL?.trim()
    || ""
  const salt =
    process.env[ALLOWLIST_SALT_ENV]?.trim()
    || process.env.DESENGINE_ALLOWLIST_SALT?.trim()
    || ""

  return {
    baseUrl,
    salt,
    isConfigured: Boolean(baseUrl && salt),
  }
}

function shouldUseSecureCookies(requestUrl: string): boolean {
  try {
    return new URL(requestUrl).protocol === "https:"
  } catch {
    return false
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", encoded)

  return toHex(digest)
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value))

  return toHex(signature)
}

async function createAllowlistMarker(email: string, salt: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email)
  return sha256Hex(`${normalizedEmail}:${salt}`)
}

async function createAccessSessionValue(email: string, secret: string): Promise<string> {
  const payload = JSON.stringify({
    v: 1,
    email: normalizeEmail(email),
    grantedAt: new Date().toISOString(),
    access: ACCESS_ALLOWED_PAYLOAD,
  })

  const payloadBytes = new TextEncoder().encode(payload)
  const encodedPayload = bytesToBase64Url(payloadBytes)
  const signature = await hmacHex(secret, encodedPayload)

  return `${encodedPayload}.${signature}`
}

async function verifyAccessSessionValue(
  cookieValue: string | undefined,
  secret: string,
): Promise<VerifiedAccessSession> {
  if (!cookieValue) {
    return { status: "invalid" }
  }

  const [encodedPayload, signature] = cookieValue.split(".")
  if (!encodedPayload || !signature) {
    return { status: "invalid" }
  }

  const expectedSignature = await hmacHex(secret, encodedPayload)
  if (expectedSignature !== signature) {
    return { status: "invalid" }
  }

  const payloadBytes = base64UrlToBytes(encodedPayload)
  if (!payloadBytes) {
    return { status: "invalid" }
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as AccessSessionPayload
    const grantedAtTime = Date.parse(payload.grantedAt ?? "")

    if (
      payload.v !== 1 ||
      payload.access !== ACCESS_ALLOWED_PAYLOAD ||
      typeof payload.email !== "string" ||
      !isPlausibleEmail(payload.email) ||
      typeof payload.grantedAt !== "string" ||
      Number.isNaN(grantedAtTime)
    ) {
      return { status: "invalid" }
    }

    const normalizedPayload = {
      access: payload.access,
      email: payload.email,
      grantedAt: payload.grantedAt,
      v: payload.v,
    } as const

    if (Date.now() - grantedAtTime > ACCESS_SESSION_TTL_MS) {
      return {
        status: "expired",
        payload: normalizedPayload,
      }
    }

    return {
      status: "valid",
      payload: normalizedPayload,
    }
  } catch {
    return { status: "invalid" }
  }
}

export {
  ACCESS_COOKIE_NAME,
  ACCESS_SESSION_TTL_MS,
  ALLOWLIST_BASE_URL_ENV,
  ALLOWLIST_SALT_ENV,
  createAccessSessionValue,
  createAllowlistMarker,
  getAccessControlConfig,
  isPlausibleEmail,
  normalizeEmail,
  shouldUseSecureCookies,
  type VerifiedAccessSession,
  verifyAccessSessionValue,
}
