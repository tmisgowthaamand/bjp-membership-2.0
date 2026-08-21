import crypto from 'crypto'

export const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_JWT_SECRET
  if (!s && process.env.NODE_ENV === 'production') {
    console.error('[FATAL] ADMIN_SESSION_SECRET / ADMIN_JWT_SECRET is required in production.')
  }
  return s || 'dev-admin-secret-change-me'
}

// Signed, tamper-proof token: base64url(payload).base64url(hmac)
export function signSession(username, role = 'super_admin', assignedDistrict = '') {
  const payload = { u: username, r: role, d: assignedDistrict, exp: Date.now() + SESSION_TTL_MS }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}

// In production the frontend (Vercel) and backend (Render) are on different
// domains, so the session cookie must be SameSite=None + Secure to be sent on
// cross-site requests. In local dev (same-origin via the Vite proxy) use Lax.
const IS_PROD = process.env.NODE_ENV === 'production'
export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: IS_PROD ? 'none' : 'lax',
  path: '/',
  maxAge: SESSION_TTL_MS,
  secure: IS_PROD,
}

export function requireAdmin(req, res, next) {
  // Prefer the Authorization: Bearer token (works cross-domain), fall back to
  // the session cookie (same-origin setups).
  let token = null
  const auth = req.headers.authorization || req.headers.Authorization
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    token = auth.slice(7).trim()
  }
  if (!token) {
    const cookies = parseCookies(req.headers.cookie)
    token = cookies[COOKIE_NAME]
  }
  const payload = verifySession(token)
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' })
  }
  req.admin = payload
  next()
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    requireAdmin(req, res, () => {
      const userRole = req.admin?.r || req.admin?.role || 'super_admin'
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Access forbidden. Insufficient permissions for this operation.' })
      }
      next()
    })
  }
}
