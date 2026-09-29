const { STAGE_META } = require('./stage')
const { dimConfig, generateActions } = require('./generators')

const NODE_HINTS = {
  客户导向: ['用户', '客户', '咨询', '投诉', '售后', '回访', '试吃', '反馈'],
  创新: ['设计', '方案', '测试', '迭代', '评审', '竞品'],
  诚信: ['交付', '验收', '回款', '质量', '采购'],
  协作: ['评审', '协作', '交付', '升级', '回访'],
  结果导向: ['目标', '计划', '交付', '上线', '回款', '复盘'],
  主人翁精神: ['采购', '生产', '交付', '复盘', '上线'],
  拥抱变化: ['需求', '方案', '迭代', '上线', '复盘'],
  追求卓越: ['质量', '设计', '测试', '检验', '验收'],
  爱公司: ['采购', '生产', '包装', '复盘', '服务', '协作'],
  社会责任: ['采购', '生产', '环保', '员工', '合规', '售后']
}

function pickNodes(nodes, valueName, limit = 2) {
  const hints = NODE_HINTS[valueName] || []
  const matched = nodes.filter((n) => hints.some((h) => n.name.includes(h)))
  const list = matched.length ? matched : nodes
  return list.slice(0, limit)
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function buildDiagnosisReport(input) {
  const { company, stageInfo, execScores, empScores, dimensionMeta, nodes, industry } = input
  const stage = stageInfo.stage
  const stageMeta = STAGE_META[stage] || STAGE_META.S2

  const rows = dimensionMeta.map((m) => {
    const key = `${m.value}-${m.dimension}`
    const exec = execScores[key]
    const emp = empScores[key]
    const execAvg = exec && exec.count ? exec.sum / exec.count : null
    const empAvg = emp && emp.count ? emp.sum / emp.count : null
    const combinedVals = [execAvg, empAvg].filter((v) => v !== null)
    const combined = combinedVals.length
      ? combinedVals.reduce((a, b) => a + b, 0) / combinedVals.length
      : null
    return {
      value: m.value,
      dimension: m.dimension,
      description: m.description,
      exec: execAvg === null ? null : round1(execAvg),
      emp: empAvg === null ? null : round1(empAvg),
      gap: execAvg !== null && empAvg !== null ? round1(execAvg - empAvg) : null,
      combined: combined === null ? null : round1(combined)
    }
  })

  const valid = rows.filter((r) => r.combined !== null)
  const maturity = valid.length
    ? round1(valid.reduce((a, r) => a + r.combined, 0) / valid.length)
    : 0

  const sortedLow = [...valid].sort((a, b) => a.combined - b.combined)
  const sortedGap = [...valid]
    .filter((r) => r.gap !== null)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))

  const keyIssues = []
  sortedLow.slice(0, 3).forEach((r) => {
    keyIssues.push({
      type: '低分维度',
      value: r.value,
      dimension: r.dimension,
      score: r.combined,
      desc: `“${r.value}—${r.dimension}”综合得分仅 ${r.combined}/5，是当前文化落地的短板。`
    })
  })
  sortedGap.slice(0, 2).forEach((r) => {
    if (Math.abs(r.gap) >= 0.8) {
      keyIssues.push({
        type: '认知差距',
        value: r.value,
        dimension: r.dimension,
        score: r.gap,
        desc:
          r.gap > 0
            ? `高管自评“${r.dimension}”为 ${r.exec}，员工评价仅 ${r.emp}，管理层认知明显高于基层实际。`
            : `员工评价“${r.dimension}”为 ${r.emp}，高于高管自评 ${r.exec}，管理层可能低估了一线实践。`
      })
    }
  })

  const focusRows = sortedLow.slice(0, 3)
  const priorities = focusRows.map((r) => {
    const node = pickNodes(nodes, r.value, 1)[0]
    return {
      value: r.value,
      dimension: r.dimension,
      process_node: node ? node.name : (nodes[0] && nodes[0].name) || '',
      stage,
      stage_name: stageMeta.name,
      reason: `“${r.value}—${r.dimension}”得分最低，优先在该价值观上补齐短板`
    }
  })

  const recommendations = []
  focusRows.forEach((r) => {
    const cfg = dimConfig(r.dimension, r.description)
    const node = pickNodes(nodes, r.value, 1)[0]
    recommendations.push({
      value: r.value,
      dimension: r.dimension,
      node: node ? node.name : '',
      action: `在「${node ? node.name : '关键流程'}」环节建立“${r.dimension}”的明确动作与检查机制，重点落实：${cfg.method}，输出${cfg.artifact}。`
    })
  })
  if (!recommendations.length) {
    recommendations.push({
      value: '客户导向',
      dimension: '倾听',
      node: nodes[0] ? nodes[0].name : '',
      action: '补齐诊断数据后，从客户导向—倾听开始建立可观察的行为标准。'
    })
  }

  const courseSuggestions = priorities.map(
    (p) => ({
      title: `${p.value}之${p.dimension}——${p.process_node}环节的行为落地（${stage}${stageMeta.name}版）`,
      value: p.value,
      dimension: p.dimension,
      node: p.process_node
    })
  )

  const priorityActionPlan = []
  focusRows.forEach((r) => {
    const node = pickNodes(nodes, r.value, 1)[0]
    const generated = generateActions({
      value: r.value,
      dimensions: [{ name: r.dimension, description: r.description }],
      nodes: node ? [node] : nodes.slice(0, 1),
      stage,
      industry
    })
    const first = generated[0] && generated[0].actions ? generated[0].actions.slice(0, 3) : []
    first.forEach((a) => priorityActionPlan.push(a.action))
  })

  return {
    stage,
    stage_reason: stageInfo.reason,
    maturity_score: maturity,
    dimension_scores: rows,
    key_issues: keyIssues,
    priorities,
    recommendations,
    course_suggestions: courseSuggestions,
    gap_analysis: sortedGap.slice(0, 5),
    priority_action_plan: priorityActionPlan
  }
}

module.exports = { buildDiagnosisReport, pickNodes }
