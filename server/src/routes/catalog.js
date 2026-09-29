const express = require('express')
const { all, get, insert, update } = require('../lib/db')
const { authRequired, optionalAuth } = require('../lib/auth')
const {
  listValues,
  getValue,
  listIndustries,
  listProcesses,
  getProcess,
  listExperts,
  listStages
} = require('../lib/data')

const router = express.Router()

router.get('/values', optionalAuth, (req, res) => {
  res.json(listValues(req.userId))
})

router.get('/values/:id', (req, res) => {
  const v = getValue(Number(req.params.id))
  if (!v) return res.status(404).json({ error: '价值观不存在' })
  res.json(v)
})

router.post('/values', authRequired, (req, res) => {
  const { name, description, dimensions } = req.body || {}
  if (!name) return res.status(400).json({ error: '价值观名称为必填项' })
  const valueId = insert('core_values', {
    name,
    description: description || '',
    is_preset: 0,
    user_id: req.userId
  })
  ;(dimensions || []).forEach((d) => {
    insert('value_dimensions', {
      value_id: valueId,
      name: typeof d === 'string' ? d : d.name,
      description: typeof d === 'string' ? '' : d.description || ''
    })
  })
  res.json(getValue(valueId))
})

router.put('/values/:id', authRequired, (req, res) => {
  const id = Number(req.params.id)
  const value = get(`SELECT * FROM core_values WHERE id = ?`, [id])
  if (!value) return res.status(404).json({ error: '价值观不存在' })
  if (value.is_preset) return res.status(403).json({ error: '预置价值观不可修改' })
  const { name, description, dimensions } = req.body || {}
  const patch = {}
  if (name !== undefined) patch.name = name
  if (description !== undefined) patch.description = description
  if (Object.keys(patch).length) update('core_values', id, patch)
  if (Array.isArray(dimensions)) {
    all(`SELECT id FROM value_dimensions WHERE value_id = ?`, [id]).forEach((d) => {
      update('value_dimensions', d.id, { name: '', description: '' })
    })
    dimensions.forEach((d) => {
      insert('value_dimensions', {
        value_id: id,
        name: typeof d === 'string' ? d : d.name,
        description: typeof d === 'string' ? '' : d.description || ''
      })
    })
  }
  res.json(getValue(id))
})

router.get('/industries', (_req, res) => {
  res.json(listIndustries())
})

router.get('/processes', optionalAuth, (req, res) => {
  const industryId = req.query.industry_id ? Number(req.query.industry_id) : null
  res.json(listProcesses(industryId, req.userId))
})

router.get('/processes/:id', (req, res) => {
  const proc = getProcess(Number(req.params.id))
  if (!proc) return res.status(404).json({ error: '流程不存在' })
  res.json(proc)
})

function parseNodesFromText(text) {
  if (!text) return []
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.map((line, idx) => {
    const cleaned = line.replace(/^\d+[.、)\]]\s*/, '')
    const [name, ...rest] = cleaned.split(/[:：\t,，]/)
    return {
      name: name.trim(),
      description: rest.join(' ').trim(),
      ordinal: idx + 1
    }
  }).filter((n) => n.name)
}

router.post('/processes/import', authRequired, (req, res) => {
  const { industry_id, department, name, description, nodes, text } = req.body || {}
  if (!name) return res.status(400).json({ error: '流程名称为必填项' })
  const processId = insert('processes', {
    industry_id: industry_id || null,
    department: department || '',
    name,
    description: description || '自定义导入流程',
    is_preset: 0,
    user_id: req.userId
  })
  const list = Array.isArray(nodes) && nodes.length ? nodes : parseNodesFromText(text)
  list.forEach((n, idx) => {
    insert('process_nodes', {
      process_id: processId,
      ordinal: n.ordinal || idx + 1,
      name: typeof n === 'string' ? n : n.name,
      description: typeof n === 'string' ? '' : n.description || ''
    })
  })
  res.json(getProcess(processId))
})

router.post('/processes', authRequired, (req, res) => {
  const { industry_id, department, name, description, nodes } = req.body || {}
  if (!name) return res.status(400).json({ error: '流程名称为必填项' })
  const processId = insert('processes', {
    industry_id: industry_id || null,
    department: department || '',
    name,
    description: description || '',
    is_preset: 0,
    user_id: req.userId
  })
  ;(nodes || []).forEach((n, idx) => {
    insert('process_nodes', {
      process_id: processId,
      ordinal: idx + 1,
      name: typeof n === 'string' ? n : n.name,
      description: typeof n === 'string' ? '' : n.description || ''
    })
  })
  res.json(getProcess(processId))
})

router.get('/stages', (_req, res) => {
  res.json(listStages())
})

router.get('/experts', (_req, res) => {
  res.json(listExperts())
})

module.exports = router
