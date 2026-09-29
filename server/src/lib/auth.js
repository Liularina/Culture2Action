const crypto = require('node:crypto')

const SECRET = process.env.APP_SECRET || 'culture2action-dev-secret'

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  const test = crypto.scryptSync(password, salt, 32).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
}

function sign(userId) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function verify(token) {
  if (!token || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  if (sig !== expected) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.exp < Date.now()) return null
    return data.uid
  } catch {
    return null
  }
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const uid = verify(token)
  if (!uid) return res.status(401).json({ error: '未登录或登录已过期' })
  req.userId = uid
  next()
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  req.userId = verify(token)
  next()
}

module.exports = { hashPassword, verifyPassword, sign, verify, authRequired, optionalAuth }
