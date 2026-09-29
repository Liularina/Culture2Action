const express = require('express')
const { all, get, insert, update } = require('../lib/db')
const { authRequired } = require('../lib/auth')

const router = express.Router()

const FIELDS = [
  'name',
  'industry',
  'size',
  'years',
  'stage',
  'revenue_trend',
  'focus',
  'structure',
  'culture_status',
  'culture_clarity',
  'pain_points',
  'event_desc',
  'event_problem'
]

router.get('/', authRequired, (req, res) => {
  res.json(
    all(`SELECT * FROM companies WHERE user_id = ? ORDER BY id DESC`, [req.userId])
  )
})

router.post('/', authRequired, (req, res) => {
  const body = req.body || {}
  const data = { user_id: req.userId }
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f]
  })
  const id = insert('companies', data)
  res.json(get(`SELECT * FROM companies WHERE id = ?`, [id]))
})

router.get('/:id', authRequired, (req, res) => {
  const company = get(`SELECT * FROM companies WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!company) return res.status(404).json({ error: '企业信息不存在' })
  res.json(company)
})

router.put('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id)
  const company = get(`SELECT * FROM companies WHERE id = ? AND user_id = ?`, [id, req.userId])
  if (!company) return res.status(404).json({ error: '企业信息不存在' })
  const body = req.body || {}
  const patch = {}
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) patch[f] = body[f]
  })
  if (Object.keys(patch).length) update('companies', id, patch)
  res.json(get(`SELECT * FROM companies WHERE id = ?`, [id]))
})

module.exports = router
