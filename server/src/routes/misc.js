const express = require('express')
const { all, get, insert, update } = require('../lib/db')
const { authRequired } = require('../lib/auth')
const { isLLMEnabled, config } = require('../lib/llm')

const router = express.Router()

router.get('/engine', authRequired, (_req, res) => {
  const cfg = config()
  res.json({ llm_enabled: isLLMEnabled(), model: cfg.model, base_url: cfg.baseUrl })
})

const PRICES = {
  diagnosis: { name: '单次诊断', amount: 149, desc: '现状自述 + 高管测评 + 员工测评 + 诊断报告' },
  actions: { name: '单次行为拆解', amount: 299, desc: '一个价值观 × 一个流程 × 一个阶段' },
  course: { name: '单次课件生成', amount: 149, desc: '一个节点的完整课件' },
  review: { name: '专家审核', amount: 399, desc: '专家审核并给出修改意见' },
  package: { name: '打包套餐', amount: 799, desc: '诊断 + 拆解 + 课件 + 审核' }
}

const FREE_FIRST = { diagnosis: true, actions: true, review: false, course: false, package: false }

router.get('/prices', (_req, res) => res.json(PRICES))

function orderCount(userId, serviceType) {
  const row = get(
    `SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND service_type = ?`,
    [userId, serviceType]
  )
  return row ? row.c : 0
}

router.get('/home', authRequired, (req, res) => {
  const count = (sql) => {
    const row = get(sql, [req.userId])
    return row ? row.c : 0
  }
  res.json({
    counts: {
      projects: count(`SELECT COUNT(*) AS c FROM projects WHERE user_id = ?`),
      diagnoses: count(`SELECT COUNT(*) AS c FROM diagnoses WHERE user_id = ?`),
      courses: count(`SELECT COUNT(*) AS c FROM courses WHERE user_id = ?`),
      reviews: count(`SELECT COUNT(*) AS c FROM expert_reviews WHERE user_id = ?`)
    },
    recent_projects: all(`SELECT * FROM projects WHERE user_id = ? ORDER BY id DESC LIMIT 5`, [req.userId]),
    recent_diagnoses: all(
      `SELECT d.*, c.name AS company_name FROM diagnoses d LEFT JOIN companies c ON c.id = d.company_id
       WHERE d.user_id = ? ORDER BY d.id DESC LIMIT 5`,
      [req.userId]
    ),
    recent_courses: all(
      `SELECT id, title, stage, created_at FROM courses WHERE user_id = ? ORDER BY id DESC LIMIT 5`,
      [req.userId]
    )
  })
})

router.get('/projects', authRequired, (req, res) => {
  const projects = all(`SELECT * FROM projects WHERE user_id = ? ORDER BY id DESC`, [req.userId])
  res.json(
    projects.map((p) => ({
      ...p,
      value_ids: JSON.parse(p.value_ids || '[]')
    }))
  )
})

router.post('/projects', authRequired, (req, res) => {
  const { name, value_ids, process_id, industry_id, department, stage, diagnosis_id } = req.body || {}
  const id = insert('projects', {
    user_id: req.userId,
    name: name || '未命名项目',
    value_ids: JSON.stringify(Array.isArray(value_ids) ? value_ids : []),
    process_id: process_id || null,
    industry_id: industry_id || null,
    department: department || '',
    stage: stage || '',
    diagnosis_id: diagnosis_id || null
  })
  res.json(get(`SELECT * FROM projects WHERE id = ?`, [id]))
})

router.get('/projects/:id', authRequired, (req, res) => {
  const project = get(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!project) return res.status(404).json({ error: '项目不存在' })
  res.json({ ...project, value_ids: JSON.parse(project.value_ids || '[]') })
})

router.put('/projects/:id', authRequired, (req, res) => {
  const project = get(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!project) return res.status(404).json({ error: '项目不存在' })
  const { name, stage, process_id, industry_id, department } = req.body || {}
  const patch = {}
  if (name !== undefined) patch.name = name
  if (stage !== undefined) patch.stage = stage
  if (process_id !== undefined) patch.process_id = process_id
  if (industry_id !== undefined) patch.industry_id = industry_id
  if (department !== undefined) patch.department = department
  if (Object.keys(patch).length) update('projects', project.id, patch)
  res.json(get(`SELECT * FROM projects WHERE id = ?`, [project.id]))
})

router.get('/orders', authRequired, (req, res) => {
  res.json(all(`SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`, [req.userId]))
})

router.post('/orders', authRequired, (req, res) => {
  const { service_type, target_id } = req.body || {}
  const price = PRICES[service_type]
  if (!price) return res.status(400).json({ error: '未知的服务类型' })
  const free = FREE_FIRST[service_type] && orderCount(req.userId, service_type) === 0
  const id = insert('orders', {
    user_id: req.userId,
    service_type,
    target_id: target_id || null,
    amount: free ? 0 : price.amount,
    status: free ? 'paid' : 'pending',
    paid_at: free ? new Date().toISOString() : null
  })
  res.json({ id, free, amount: free ? 0 : price.amount, service: price, status: free ? 'paid' : 'pending' })
})

router.post('/orders/:id/pay', authRequired, (req, res) => {
  const order = get(`SELECT * FROM orders WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!order) return res.status(404).json({ error: '订单不存在' })
  update('orders', order.id, { status: 'paid', paid_at: new Date().toISOString() })
  res.json(get(`SELECT * FROM orders WHERE id = ?`, [order.id]))
})

function buildExpertOpinion(review, content) {
  const score = 4 + Math.random()
  const base = [
    '行为拆解整体结构完整，行动描述基本可观察、可评估。',
    '案例有真实感，能帮助学员理解抽象价值观。',
    '企业阶段适配方向正确，建议进一步细化责任人与检查机制。'
  ]
  const suggestions = [
    '建议为每条行动补充明确的完成时限和检查人，便于落地追踪。',
    '建议增加 1-2 个反面案例，强化行为边界认知。',
    '建议在考核点中加入量化指标，例如闭环率、响应时长。',
    '建议结合贵司实际业务术语，替换模板化表述，提升代入感。'
  ]
  return {
    score: Math.round(score * 10) / 10,
    comment: base.join(''),
    suggestions
  }
}

router.get('/reviews', authRequired, (req, res) => {
  res.json(
    all(
      `SELECT r.*, e.name AS expert_name, e.level AS expert_level, e.industry AS expert_industry
       FROM expert_reviews r LEFT JOIN experts e ON e.id = r.expert_id
       WHERE r.user_id = ? ORDER BY r.id DESC`,
      [req.userId]
    )
  )
})

router.post('/reviews', authRequired, (req, res) => {
  const { target_type, target_id, expert_id } = req.body || {}
  if (!target_type || !target_id) return res.status(400).json({ error: '请提供审核对象' })
  let title = '文化落地内容审核'
  let snapshot = ''
  if (target_type === 'course') {
    const course = get(`SELECT * FROM courses WHERE id = ? AND user_id = ?`, [target_id, req.userId])
    if (!course) return res.status(404).json({ error: '课件不存在' })
    title = course.title
    snapshot = course.content_json
  } else if (target_type === 'diagnosis') {
    const report = get(
      `SELECT r.* FROM diagnosis_reports r JOIN diagnoses d ON d.id = r.diagnosis_id WHERE r.diagnosis_id = ? AND d.user_id = ?`,
      [target_id, req.userId]
    )
    title = '诊断报告审核'
    snapshot = report ? JSON.stringify(report) : ''
  } else {
    title = '行为清单审核'
    snapshot = JSON.stringify(all(`SELECT * FROM actions WHERE id IN (SELECT value FROM json_each(?))`, [JSON.stringify([target_id])]))
  }
  const expert = expert_id
    ? get(`SELECT * FROM experts WHERE id = ?`, [expert_id])
    : all(`SELECT * FROM experts ORDER BY rating DESC`)[0]
  const id = insert('expert_reviews', {
    user_id: req.userId,
    target_type,
    target_id,
    title,
    content_snapshot: snapshot,
    expert_id: expert ? expert.id : null,
    status: 'pending'
  })
  res.json({
    ...get(`SELECT * FROM expert_reviews WHERE id = ?`, [id]),
    expert
  })
})

router.get('/reviews/:id', authRequired, (req, res) => {
  const review = get(
    `SELECT r.*, e.name AS expert_name, e.level AS expert_level, e.industry AS expert_industry, e.intro AS expert_intro
     FROM expert_reviews r LEFT JOIN experts e ON e.id = r.expert_id
     WHERE r.id = ? AND r.user_id = ?`,
    [Number(req.params.id), req.userId]
  )
  if (!review) return res.status(404).json({ error: '审核记录不存在' })
  review.suggestions = review.suggestions ? JSON.parse(review.suggestions) : []
  res.json(review)
})

router.post('/reviews/:id/complete', authRequired, (req, res) => {
  const review = get(`SELECT * FROM expert_reviews WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!review) return res.status(404).json({ error: '审核记录不存在' })
  const opinion = buildExpertOpinion(review, review.content_snapshot)
  update('expert_reviews', review.id, {
    status: 'completed',
    score: opinion.score,
    comment: opinion.comment,
    suggestions: JSON.stringify(opinion.suggestions),
    reviewed_at: new Date().toISOString()
  })
  const updated = get(
    `SELECT r.*, e.name AS expert_name, e.level AS expert_level, e.industry AS expert_industry
     FROM expert_reviews r LEFT JOIN experts e ON e.id = r.expert_id WHERE r.id = ?`,
    [review.id]
  )
  updated.suggestions = JSON.parse(updated.suggestions || '[]')
  res.json(updated)
})

router.post('/feedbacks', authRequired, (req, res) => {
  const { target_type, target_id, rating, comment } = req.body || {}
  const id = insert('feedbacks', {
    user_id: req.userId,
    target_type,
    target_id,
    rating: rating || 5,
    comment: comment || ''
  })
  res.json(get(`SELECT * FROM feedbacks WHERE id = ?`, [id]))
})

router.get('/feedbacks', authRequired, (req, res) => {
  res.json(all(`SELECT * FROM feedbacks WHERE user_id = ? ORDER BY id DESC`, [req.userId]))
})

module.exports = router
