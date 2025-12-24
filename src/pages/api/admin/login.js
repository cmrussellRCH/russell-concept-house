import {
  createSessionToken,
  requireAdminConfig,
  setSessionCookie,
  isEmailAllowed
} from '../../../lib/admin/session'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const missing = requireAdminConfig()
  if (missing.length) {
    return res.status(500).json({
      error: `Missing admin configuration: ${missing.join(', ')}`
    })
  }

  const { email, code } = req.body || {}

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and access code are required.' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedCode = String(code).trim()

  if (!isEmailAllowed(normalizedEmail)) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  if (normalizedCode !== process.env.ADMIN_ACCESS_CODE) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  const token = createSessionToken(normalizedEmail)
  if (!token) {
    return res.status(500).json({ error: 'Session secret not configured.' })
  }

  setSessionCookie(res, token)
  return res.status(200).json({ ok: true })
}
