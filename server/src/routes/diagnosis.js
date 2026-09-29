const express = require('express')
const { all, get, insert, run, update } = require('../lib/db')
const { authRequired } = require('../lib/auth')
const { getValue, getProcess, listProcesses, listValues } = require('../lib/data')
const { questionsForDimension } = require('../lib/question-bank')
const { judgeStage } = require('../lib/stage')
const { buildDiagnosisReport } = require('../lib/report')

const router = express.Router()

function createQuestionsForDiagnosis(diagnosisId, valueIds) {
  run(`DELETE FROM diagnosis_questions WHERE diagnosis_id = ?`, [diagnosisId])
  const meta = []
  valueIds.forEach((valueId) => {
    const value = getValue(Number(valueId))
    if (!value) return
    value.dimensions.forEach((dim) => {
      const bank = questionsForDimension(value.name, dim.name, dim.description)
      ;['exec', 'emp'].forEach((target) => {
        bank[target].forEach(([question, scale], idx) => {
          insert('diagnosis_questions', {
            diagnosis_id: diagnosisId,
            type: target === 'exec' ? '高管行为测评' : '员工行为测评',
            value_dimension: dim.name,
            value_name: value.name,
            question,
            target,
            ordinal: idx + 1,
            scale
          })
        })
        meta.push({ value: value.name, dimension: dim.name, description: dim.description })
      })
    })
  })
  return meta
}

function resolveProcess(company, processId) {
  if (processId) return getProcess(Number(processId))
  const preset = listProcesses(null, 0).find(
    (p) => company && p.industry_name && company.industry && p.industry_name === company.industry
  )
  if (preset) return getProcess(preset.id)
  const first = listProcesses(null, 0)[0]
  return first ? getProcess(first.id) : null
}

router.post('/', authRequired, (req, res) => {
  const { company_id, name, type, value_ids } = req.body || {}
  if (!company_id) return res.status(400).json({ error: '请先选择或创建企业' })
  const company = get(`SELECT * FROM companies WHERE id = ? AND user_id = ?`, [
    company_id,
    req.userId
  ])
  if (!company) return res.status(404).json({ error: '企业信息不存在' })
  const values = Array.isArray(value_ids) && value_ids.length ? value_ids : [1]
  const diagnosisId = insert('diagnoses', {
    company_id,
    user_id: req.userId,
    type: type || 'full',
    status: 'draft',
    name: name || `${company.name || '企业'}文化诊断`
  })
  createQuestionsForDiagnosis(diagnosisId, values)
  res.json({
    id: diagnosisId,
    company,
    question_count: all(`SELECT id FROM diagnosis_questions WHERE diagnosis_id = ?`, [diagnosisId]).length
  })
})

router.get('/', authRequired, (req, res) => {
  res.json(
    all(
      `SELECT d.*, c.name AS company_name, c.industry AS company_industry,
        (SELECT COUNT(*) FROM diagnosis_answers a WHERE a.diagnosis_id = d.id) AS answer_count
       FROM diagnoses d LEFT JOIN companies c ON c.id = d.company_id
       WHERE d.user_id = ? ORDER BY d.id DESC`,
      [req.userId]
    )
  )
})

router.get('/:id', authRequired, (req, res) => {
  const diagnosis = get(`SELECT * FROM diagnoses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!diagnosis) return res.status(404).json({ error: '诊断不存在' })
  const company = get(`SELECT * FROM companies WHERE id = ?`, [diagnosis.company_id])
  const questions = all(
    `SELECT * FROM diagnosis_questions WHERE diagnosis_id = ? ORDER BY id ASC`,
    [diagnosis.id]
  )
  const answers = all(
    `SELECT * FROM diagnosis_answers WHERE diagnosis_id = ? ORDER BY id ASC`,
    [diagnosis.id]
  )
  const report = get(`SELECT * FROM diagnosis_reports WHERE diagnosis_id = ?`, [diagnosis.id])
  res.json({ ...diagnosis, company, questions, answers, report })
})

router.get('/:id/questions', authRequired, (req, res) => {
  const diagnosis = get(`SELECT * FROM diagnoses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!diagnosis) return res.status(404).json({ error: '诊断不存在' })
  const target = req.query.target
  let sql = `SELECT * FROM diagnosis_questions WHERE diagnosis_id = ?`
  const params = [diagnosis.id]
  if (target) {
    sql += ` AND target = ?`
    params.push(target)
  }
  sql += ` ORDER BY id ASC`
  const questions = all(sql, params)
  const answers = all(`SELECT * FROM diagnosis_answers WHERE diagnosis_id = ?`, [diagnosis.id])
  const answerMap = {}
  answers.forEach((a) => {
    const key = `${a.question_id}:${a.respondent_type}`
    answerMap[key] = a.score
  })
  res.json({ questions, answers: answerMap })
})

router.post('/:id/answers', authRequired, (req, res) => {
  const diagnosis = get(`SELECT * FROM diagnoses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!diagnosis) return res.status(404).json({ error: '诊断不存在' })
  const { answers, respondent_type } = req.body || {}
  if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers 必须为数组' })
  answers.forEach((a) => {
    const rt = a.respondent_type || respondent_type
    if (!rt) return
    run(`DELETE FROM diagnosis_answers WHERE diagnosis_id = ? AND question_id = ? AND respondent_type = ?`, [
      diagnosis.id,
      a.question_id,
      rt
    ])
    if (a.score !== null && a.score !== undefined && a.score !== '') {
      insert('diagnosis_answers', {
        diagnosis_id: diagnosis.id,
        question_id: a.question_id,
        respondent_type: rt,
        score: Number(a.score),
        comment: a.comment || ''
      })
    }
  })
  update('diagnoses', diagnosis.id, { status: 'in_progress' })
  res.json({ ok: true, answer_count: all(`SELECT id FROM diagnosis_answers WHERE diagnosis_id = ?`, [diagnosis.id]).length })
})

router.post('/:id/report', authRequired, (req, res) => {
  const diagnosis = get(`SELECT * FROM diagnoses WHERE id = ? AND user_id = ?`, [
    Number(req.params.id),
    req.userId
  ])
  if (!diagnosis) return res.status(404).json({ error: '诊断不存在' })
  const company = get(`SELECT * FROM companies WHERE id = ?`, [diagnosis.company_id]) || {}
  const questions = all(
    `SELECT * FROM diagnosis_questions WHERE diagnosis_id = ? ORDER BY id ASC`,
    [diagnosis.id]
  )
  const answers = all(
    `SELECT * FROM diagnosis_answers WHERE diagnosis_id = ?`,
    [diagnosis.id]
  )
  const qMap = {}
  questions.forEach((q) => (qMap[q.id] = q))

  const execScores = {}
  const empScores = {}
  answers.forEach((a) => {
    const q = qMap[a.question_id]
    if (!q || a.score === null) return
    const key = `${q.value_name}-${q.value_dimension}`
    const bucket = q.target === 'exec' ? execScores : empScores
    if (!bucket[key]) bucket[key] = { sum: 0, count: 0 }
    bucket[key].sum += Number(a.score)
    bucket[key].count += 1
  })

  const dimensionMap = new Map()
  questions.forEach((q) => {
    const key = `${q.value_name}-${q.value_dimension}`
    if (!dimensionMap.has(key)) {
      dimensionMap.set(key, {
        value: q.value_name,
        dimension: q.value_dimension,
        description: ''
      })
    }
  })
  const valueNames = [...new Set(questions.map((q) => q.value_name))]
  listValues(req.userId).forEach((v) => {
    if (!valueNames.includes(v.name)) return
    v.dimensions.forEach((d) => {
      const key = `${v.name}-${d.name}`
      if (dimensionMap.has(key)) dimensionMap.get(key).description = d.description
    })
  })

  const stageInfo = judgeStage(company)
  const process = resolveProcess(company, req.body && req.body.process_id)
  const report = buildDiagnosisReport({
    company,
    stageInfo,
    execScores,
    empScores,
    dimensionMeta: [...dimensionMap.values()],
    nodes: process ? process.nodes : [],
    industry: company.industry || ''
  })
  report.process_id = process ? process.id : null
  report.process_name = process ? process.name : ''

  run(`DELETE FROM diagnosis_reports WHERE diagnosis_id = ?`, [diagnosis.id])
  const reportId = insert('diagnosis_reports', {
    diagnosis_id: diagnosis.id,
    stage: report.stage,
    stage_reason: report.stage_reason,
    maturity_score: report.maturity_score,
    key_issues: JSON.stringify(report.key_issues),
    priorities: JSON.stringify(report.priorities),
    recommendations: JSON.stringify(report.recommendations),
    dimension_scores: JSON.stringify(report.dimension_scores),
    gap_analysis: JSON.stringify(report.gap_analysis),
    course_suggestions: JSON.stringify(report.course_suggestions)
  })
  if (!company.stage) update('companies', company.id, { stage: report.stage })
  update('diagnoses', diagnosis.id, { status: 'completed' })
  res.json({ id: reportId, diagnosis_id: diagnosis.id, ...report })
})

router.get('/:id/report', authRequired, (req, res) => {
  const report = get(
    `SELECT r.* FROM diagnosis_reports r JOIN diagnoses d ON d.id = r.diagnosis_id
     WHERE r.diagnosis_id = ? AND d.user_id = ?`,
    [Number(req.params.id), req.userId]
  )
  if (!report) return res.status(404).json({ error: '诊断报告尚未生成' })
  res.json({
    ...report,
    key_issues: JSON.parse(report.key_issues || '[]'),
    priorities: JSON.parse(report.priorities || '[]'),
    recommendations: JSON.parse(report.recommendations || '[]'),
    dimension_scores: JSON.parse(report.dimension_scores || '[]'),
    gap_analysis: JSON.parse(report.gap_analysis || '[]'),
    course_suggestions: JSON.parse(report.course_suggestions || '[]')
  })
})

module.exports = router
