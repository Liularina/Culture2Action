const express = require('express')
const { get, update } = require('../lib/db')
const { insert } = require('../lib/db')
const { hashPassword, verifyPassword, sign, authRequired } = require('../lib/auth')

const router = express.Router()

router.post('/register', (req, res) => {
  const { nickname, phone, password, company, industry, role } = req.body || {}
  if (!nickname || !phone || !password) {
    return res.status(400).json({ error: '昵称、手机号、密码为必填项' })
  }
  const exists = get(`SELECT id FROM users WHERE phone = ?`, [phone])
  if (exists) return res.status(409).json({ error: '该手机号已注册' })
  const id = insert('users', {
    nickname,
    phone,
    password_hash: hashPassword(password),
    company: company || '',
    industry: industry || '',
    role: role || 'HR'
  })
  const user = get(`SELECT id, nickname, phone, company, industry, role FROM users WHERE id = ?`, [id])
  res.json({ token: sign(id), user })
})

router.post('/login', (req, res) => {
  const { phone, password } = req.body || {}
  if (!phone || !password) return res.status(400).json({ error: '手机号和密码为必填项' })
  const user = get(`SELECT * FROM users WHERE phone = ?`, [phone])
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '手机号或密码错误' })
  }
  const { password_hash, ...safe } = user
  res.json({ token: sign(user.id), user: safe })
})

router.get('/me', authRequired, (req, res) => {
  const user = get(
    `SELECT id, nickname, phone, company, industry, role FROM users WHERE id = ?`,
    [req.userId]
  )
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json(user)
})

router.put('/me', authRequired, (req, res) => {
  const { nickname, company, industry, role } = req.body || {}
  const patch = {}
  if (nickname !== undefined) patch.nickname = nickname
  if (company !== undefined) patch.company = company
  if (industry !== undefined) patch.industry = industry
  if (role !== undefined) patch.role = role
  if (Object.keys(patch).length) update('users', req.userId, patch)
  const user = get(
    `SELECT id, nickname, phone, company, industry, role FROM users WHERE id = ?`,
    [req.userId]
  )
  res.json(user)
})

module.exports = router
