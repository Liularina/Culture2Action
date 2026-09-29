const express = require('express')
const { all, get, insert, update, run } = require('../lib/db')
const { authRequired } = require('../lib/auth')
const { getValue, getProcess, listValues } = require('../lib/data')
const { generateActions, generateCourse, adaptActionText } = require('../lib/generators')
const { courseToDocx, coursesToDocx, courseToPptx } = require('../lib/exporters')
const { chatJSON, isLLMEnabled } = require('../lib/llm')

const router = express.Router()

function persistActions({ value, dimension, node, stage, actions, process, industryId }) {
  const ids = []
  actions.forEach((a) => {
    ids.push(
      insert('actions', {
        value_id: value ? value.id : null,
        value_name: value ? value.name : '',
        dimension_id: null,
        dimension_name: dimension,
        node_id: node ? node.id : null,
        node_name: node ? node.name : '',
        process_id: process ? process.id : null,
        industry_id: industryId || (process ? process.industry_id : null),
        stage,
        action: a.action,
        observable: 1,
        assessment: a.assessment,
        training_case: a.case || a.training_case || ''
      })
    )
  })
  return ids
}

async function maybeLLMActions({ value, dimension, description, nodes, stage, industry }) {
  if (!isLLMEnabled()) return null
  const nodeText = nodes.map((n) => n.name).join('、')
  const prompt = `你是企业文化落地专家。请围绕价值观“${value}”的子维度“${dimension}”（含义：${description}），
针对流程节点【${nodeText}】，结合企业阶段“${stage}”和行业“${industry || '通用'}”，拆解具体行动。
要求：
1. 为每个节点输出至少5条可观察、可评估的行动
2. 每条行动配 assessment（评估标准）和 case（真实感案例）
3. 语言具体，体现${stage}阶段特点
只输出 JSON，格式：{"groups":[{"node":"节点名","actions":[{"action":"","assessment":"","case":""}]}]}`
  const data = await chatJSON([{ role: 'user', content: prompt }], { timeout: 60000 })
  if (!data || !Array.isArray(data.groups)) return null
  return data.groups
}

router.post('/actions/generate', authRequired, async (req, res) => {
  const { value_ids, process_id, stage, persist = true, nodes: nodeIds } = req.body || {}
  const process = getProcess(Number(process_id))
  if (!process) return res.status(400).json({ error: '请选择有效的流程' })
  const values = (Array.isArray(value_ids) ? value_ids : [value_ids])
    .map((id) => getValue(Number(id)))
    .filter(Boolean)
  if (!values.length) return res.status(400).json({ error: '请选择至少一个价值观' })
  const nodes =
    Array.isArray(nodeIds) && nodeIds.length
      ? process.nodes.filter((n) => nodeIds.includes(n.id))
      : process.nodes

  const groups = []
  for (const value of values) {
    for (const dim of value.dimensions) {
      let rawGroups = await maybeLLMActions({
        value: value.name,
        dimension: dim.name,
        description: dim.description,
        nodes,
        stage,
        industry: process.industry_name
      })
      if (!rawGroups) {
        rawGroups = nodes.map((n) => {
          const per = generateActions({
            value: value.name,
            dimensions: [{ name: dim.name, description: dim.description }],
            nodes: [n],
            stage,
            industry: process.industry_name || ''
          })
          return {
            node: n.name,
            node_id: n.id,
            actions: per[0] ? per[0].actions : []
          }
        })
      } else {
        rawGroups = rawGroups.map((g) => {
          const node = nodes.find((n) => n.name === g.node) || nodes[0]
          return {
            node: g.node,
            node_id: node ? node.id : null,
            actions: (g.actions || []).map((a) => ({
              action: a.action,
              assessment: a.assessment || '',
              case: a.case || a.training_case || ''
            }))
          }
        })
      }

      if (persist) {
        rawGroups.forEach((g) => {
          const node = nodes.find((n) => n.id === g.node_id) || nodes.find((n) => n.name === g.node)
          persistActions({
            value,
            dimension: dim.name,
            node,
            stage,
            actions: g.actions,
            process,
            industryId: process.industry_id
          })
        })
      }

      groups.push({
        value_id: value.id,
        value: value.name,
        dimension_id: dim.id,
        dimension: dim.name,
        description: dim.description,
        nodes: rawGroups
      })
    }
  }

  res.json({ process: { id: process.id, name: process.name, industry: process.industry_name }, stage, groups })
})

router.get('/actions', authRequired, (req, res) => {
  const { process_id, value_id, stage, node_id, dimension } = req.query
  let sql = `SELECT * FROM actions WHERE 1=1`
  const params = []
  if (process_id) {
    sql += ` AND process_id = ?`
    params.push(Number(process_id))
  }
  if (value_id) {
    sql += ` AND value_id = ?`
    params.push(Number(value_id))
  }
  if (node_id) {
    sql += ` AND node_id = ?`
    params.push(Number(node_id))
  }
  if (stage) {
    sql += ` AND stage = ?`
    params.push(stage)
  }
  if (dimension) {
    sql += ` AND dimension_name = ?`
    params.push(dimension)
  }
  sql += ` ORDER BY node_id, value_id, id`
  res.json(all(sql, params))
})

router.post('/actions/adapt', authRequired, async (req, res) => {
  const { value_id, stage, target_process_id, source_industry } = req.body || {}
  const value = getValue(Number(value_id))
  const process = getProcess(Number(target_process_id))
  if (!value || !process) return res.status(400).json({ error: '请提供有效的价值观和流程' })
  const groups = value.dimensions.map((dim) => {
    const generated = generateActions({
      value: value.name,
      dimensions: [{ name: dim.name, description: dim.description }],
      nodes: process.nodes,
      stage,
      industry: process.industry_name || ''
    })
    return {
      dimension: dim.name,
      nodes: (generated[0] ? generated[0].actions : []).length
        ? process.nodes.map((n, i) => ({
            node: n.name,
            actions: generated
              .filter((g) => g.node === n.name)
              .flatMap((g) => g.actions)
              .map((a) => ({
                ...a,
                action: adaptActionText(a.action, process.industry_name || '目标行业', n.name, stage)
              }))
          }))
        : []
    }
  })
  res.json({
    value: value.name,
    source_industry: source_industry || '',
    target_industry: process.industry_name,
    target_process: process.name,
    stage,
    groups
  })
})

router.post('/courses/generate', authRequired, async (req, res) => {
  const {
    node_id,
    value_id,
    dimension_id,
    dimension_name,
    stage,
    process_id,
    actions
  } = req.body || {}
  const node = get(`SELECT * FROM process_nodes WHERE id = ?`, [Number(node_id)])
  if (!node) return res.status(400).json({ error: '请选择有效的流程节点' })
  const value = getValue(Number(value_id))
  if (!value) return res.status(400).json({ error: '请选择有效的价值观' })
  const dim =
    value.dimensions.find((d) => d.name === dimension_name) ||
    value.dimensions.find((d) => d.id === Number(dimension_id)) ||
    value.dimensions[0]
  const process = process_id ? getProcess(Number(process_id)) : getProcess(node.process_id)

  let actionList = Array.isArray(actions) && actions.length ? actions : null
  if (!actionList) {
    const persisted = all(
      `SELECT * FROM actions WHERE node_id = ? AND value_id = ? AND dimension_name = ? AND stage = ?`,
      [node.id, value.id, dim.name, stage]
    )
    if (persisted.length) {
      actionList = persisted.map((a) => ({
        action: a.action,
        assessment: a.assessment,
        training_case: a.training_case
      }))
    } else {
      const generated = generateActions({
        value: value.name,
        dimensions: [{ name: dim.name, description: dim.description }],
        nodes: [node],
        stage,
        industry: process ? process.industry_name || '' : ''
      })
      actionList = generated[0] ? generated[0].actions : []
    }
  }

  const content = generateCourse({
    value: value.name,
    dimension: dim.name,
    dimensionDescription: dim.description,
    node,
    stage,
    actions: actionList,
    industry: process ? process.industry_name || '' : '',
    processName: process ? process.name : ''
  })

  const id = insert('courses', {
    user_id: req.userId,
    node_id: node.id,
    value_id: value.id,
    dimension_id: dim.id,
    stage,
    title: content.title,
    content_json: JSON.stringify(content),
    format: 'word'
  })
  res.json({ id, ...content, content_json: content })
})

router.get('/courses', authRequired, (req, res) => {
  res.json(
    all(`SELECT id, title, node_id, value_id, dimension_id, stage, format, created_at FROM courses WHERE user_id = ? ORDER BY id DESC`, [
      req.userId
    ])
  )
})

router.get('/courses/:id', authRequired, (req, res) => {
  const course = get(`SELECT * FROM courses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!course) return res.status(404).json({ error: '课件不存在' })
  res.json({ ...course, content: JSON.parse(course.content_json || '{}') })
})

router.put('/courses/:id', authRequired, (req, res) => {
  const course = get(`SELECT * FROM courses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!course) return res.status(404).json({ error: '课件不存在' })
  const { content, title } = req.body || {}
  const patch = {}
  if (content) patch.content_json = JSON.stringify(content)
  if (title) patch.title = title
  if (Object.keys(patch).length) update('courses', course.id, patch)
  const updated = get(`SELECT * FROM courses WHERE id = ?`, [course.id])
  res.json({ ...updated, content: JSON.parse(updated.content_json || '{}') })
})

router.get('/courses/:id/export', authRequired, async (req, res) => {
  const course = get(`SELECT * FROM courses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!course) return res.status(404).json({ error: '课件不存在' })
  const content = JSON.parse(course.content_json || '{}')
  const format = (req.query.format || 'word').toLowerCase()
  try {
    if (format === 'ppt' || format === 'pptx') {
      const buf = await courseToPptx(content)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
      res.setHeader('Content-Disposition', `attachment; filename="course-${course.id}.pptx"`)
      return res.send(Buffer.from(buf))
    }
    const buf = await courseToDocx(content)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="course-${course.id}.docx"`)
    return res.send(buf)
  } catch (err) {
    console.error('[export] failed', err)
    return res.status(500).json({ error: '导出失败' })
  }
})

router.post('/courses/export', authRequired, async (req, res) => {
  const { ids, format = 'word' } = req.body || {}
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: '请选择课件' })
  const placeholders = ids.map(() => '?').join(',')
  const courses = all(
    `SELECT * FROM courses WHERE id IN (${placeholders}) AND user_id = ? ORDER BY id`,
    [...ids, req.userId]
  )
  const contents = courses.map((c) => JSON.parse(c.content_json || '{}'))
  if (!contents.length) return res.status(404).json({ error: '未找到课件' })
  try {
    if (format === 'ppt' || format === 'pptx') {
      const PptxGenJS = require('pptxgenjs')
      const pptx = new PptxGenJS()
      pptx.layout = 'LAYOUT_WIDE'
      for (const c of contents) {
        const cover = pptx.addSlide()
        cover.addText(c.title || '培训课件', { x: 0.5, y: 2, w: 12, h: 1.5, fontSize: 30, bold: true, align: 'center', color: '1F3A93' })
        ;(c.actions || []).forEach((a) => {
          const s = pptx.addSlide()
          s.addText(a.action || '', { x: 0.5, y: 0.5, w: 12, h: 1, fontSize: 22, bold: true, color: '1F3A93' })
          if (a.assessment) s.addText(`评估标准：${a.assessment}`, { x: 0.6, y: 1.8, w: 11, h: 2, fontSize: 16 })
          if (a.training_case) s.addText(`案例：${a.training_case}`, { x: 0.6, y: 3.5, w: 11, h: 2, fontSize: 16 })
        })
      }
      const buf = await pptx.write({ outputType: 'nodebuffer' })
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
      res.setHeader('Content-Disposition', 'attachment; filename="courses.pptx"')
      return res.send(Buffer.from(buf))
    }
    const buf = await coursesToDocx(contents)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', 'attachment; filename="courses.docx"')
    return res.send(buf)
  } catch (err) {
    console.error('[export-batch] failed', err)
    return res.status(500).json({ error: '导出失败' })
  }
})

module.exports = router
