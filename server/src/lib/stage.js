const STAGE_META = {
  S1: {
    name: '初创期',
    size: '1-30人',
    years: '0-3年',
    tone: '创始人亲自做，行为具体、基础、偏“底线”',
    behaviors: '不浪费、不挑活、主动补位、快速响应',
    feature: '生存第一，一人多岗'
  },
  S2: {
    name: '成长期',
    size: '30-200人',
    years: '3-10年',
    tone: '开始建流程和机制，行为可复制、可考核',
    behaviors: '建立反馈机制、跨部门协作、结果交付',
    feature: '快速扩张，流程初建'
  },
  S3: {
    name: '成熟期',
    size: '200-2000人',
    years: '10-20年',
    tone: '体系化、数据化，行为偏“高线”和专业化',
    behaviors: '建立系统、数据驱动、培养他人、对外分享',
    feature: '体系完善，文化沉淀'
  },
  S4: {
    name: '集团化/生态期',
    size: '2000人+',
    years: '20年+',
    tone: '战略引领、组织能力、社会责任，行为跨业务跨地域',
    behaviors: '组织变革、社会责任、塑造行业标准',
    feature: '多业务、跨地域'
  }
}

function sizeToNumber(size) {
  if (!size) return null
  if (typeof size === 'number') return size
  const text = String(size)
  if (text.includes('+')) {
    const n = parseInt(text.replace(/[^0-9]/g, ''), 10)
    return Number.isNaN(n) ? null : n * 1.5
  }
  const nums = text.match(/\d+/g)
  if (!nums || !nums.length) return null
  const parsed = nums.map(Number)
  if (parsed.length >= 2) return (parsed[0] + parsed[1]) / 2
  return parsed[0]
}

function yearsToNumber(years) {
  if (!years) return null
  if (typeof years === 'number') return years
  const text = String(years)
  if (text.includes('+')) return parseInt(text) + 5
  const nums = text.match(/\d+/g)
  if (!nums || !nums.length) return null
  const parsed = nums.map(Number)
  if (parsed.length >= 2) return (parsed[0] + parsed[1]) / 2
  return parsed[0]
}

function judgeStage(input = {}) {
  const size = sizeToNumber(input.size)
  const years = yearsToNumber(input.years)
  const focus = input.focus || ''
  const structure = input.structure || ''
  const revenue = input.revenue_trend || ''

  let code = 'S1'
  if ((size !== null && size >= 2000) || (years !== null && years >= 20)) {
    code = 'S4'
  } else if ((size !== null && size >= 200) || (years !== null && years >= 10)) {
    code = 'S3'
  } else if ((size !== null && size >= 30) || (years !== null && years >= 3)) {
    code = 'S2'
  } else {
    code = 'S1'
  }

  const notes = []
  if (focus.includes('扩张') && code === 'S2') {
    code = 'S3'
    notes.push('关注扩张，组织复杂度上升，阶段上调')
  }
  if (focus.includes('活下去') && code !== 'S1') {
    code = code === 'S4' ? 'S3' : code === 'S3' ? 'S2' : 'S1'
    notes.push('以生存为首要目标，阶段下调')
  }
  if (structure.includes('矩阵') && code === 'S2') {
    code = 'S3'
    notes.push('采用矩阵式组织，管理层级增多，阶段上调')
  }
  if (revenue.includes('下滑') && code === 'S4') {
    code = 'S3'
    notes.push('营收下滑，业务收缩，阶段下调')
  }

  const meta = STAGE_META[code]
  const reasonParts = [
    size !== null ? `员工规模约 ${Math.round(size)} 人` : null,
    years !== null ? `成立约 ${Math.round(years)} 年` : null,
    input.revenue_trend ? `营收${input.revenue_trend}` : null,
    input.focus ? `当前最关注${input.focus}` : null,
    input.structure ? `组织${input.structure}` : null,
    ...notes
  ].filter(Boolean)

  return {
    stage: code,
    name: meta.name,
    feature: meta.feature,
    reason: `依据${reasonParts.join('、')}，判断为 ${code} ${meta.name}：${meta.feature}。`
  }
}

module.exports = { judgeStage, STAGE_META, sizeToNumber, yearsToNumber }
