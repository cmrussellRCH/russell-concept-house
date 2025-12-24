import crypto from 'crypto'

const COOKIE_NAME = 'rch_admin'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || ''
}

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

export function createSessionToken(email) {
  const secret = getSecret()
  if (!secret) return null

  const now = Date.now()
  const payload = {
    email,
    iat: now,
    exp: now + SESSION_TTL_MS
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encoded, secret)

  return `${encoded}.${signature}`
}

export function verifySessionToken(token) {
  const secret = getSecret()
  if (!secret || !token) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = sign(encoded, secret)
  if (signature.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (!payload?.email || !payload?.exp) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch (error) {
    return null
  }
}

export function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=')
    if (!key) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}

export function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers?.cookie || '')
  return verifySessionToken(cookies[COOKIE_NAME])
}

export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : null
  ].filter(Boolean).join('; ')

  res.setHeader('Set-Cookie', cookie)
}

export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookie = [
    `${COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : null
  ].filter(Boolean).join('; ')

  res.setHeader('Set-Cookie', cookie)
}

export function isEmailAllowed(email) {
  const allowlist = getAdminEmails()
  if (!allowlist.length) return false
  return allowlist.includes(email.trim().toLowerCase())
}

export function requireAdminSession(req) {
  const session = getSessionFromRequest(req)
  if (!session) return null
  if (!isEmailAllowed(session.email)) return null
  return session
}

export function requireAdminConfig() {
  const missing = []
  if (!process.env.ADMIN_EMAILS) missing.push('ADMIN_EMAILS')
  if (!process.env.ADMIN_ACCESS_CODE) missing.push('ADMIN_ACCESS_CODE')
  if (!process.env.ADMIN_SESSION_SECRET) missing.push('ADMIN_SESSION_SECRET')
  return missing
}
