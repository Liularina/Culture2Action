const { init, get, insert, all } = require('./lib/db')
const { VALUES, INDUSTRIES, PROCESSES, STAGES, EXPERTS } = require('./lib/seed-data')
const { hashPassword } = require('./lib/auth')

init()

const existing = get(`SELECT COUNT(*) AS c FROM core_values WHERE is_preset = 1`)
if (existing && existing.c > 0) {
  console.log('[seed] preset data already exists, skip. (remove server/data/*.db to reseed)')
  process.exit(0)
}

const industryIds = {}
INDUSTRIES.forEach(([name, description]) => {
  industryIds[name] = insert('industries', { name, description })
})

VALUES.forEach((v) => {
  const valueId = insert('core_values', {
    name: v.name,
    description: v.description,
    is_preset: 1,
    user_id: null
  })
  v.dimensions.forEach(([name, description]) => {
    insert('value_dimensions', { value_id: valueId, name, description })
  })
})

PROCESSES.forEach((p) => {
  const processId = insert('processes', {
    industry_id: industryIds[p.industry] || null,
    department: p.department,
    name: p.name,
    description: p.description,
    is_preset: 1,
    user_id: null
  })
  p.nodes.forEach(([name, description], idx) => {
    insert('process_nodes', {
      process_id: processId,
      ordinal: idx + 1,
      name,
      description
    })
  })
})

STAGES.forEach(([code, name, size, years, features, keywords]) => {
  insert('stages', { code, name, size, years, features, keywords })
})

EXPERTS.forEach(([name, industry, domain, level, rating, intro]) => {
  insert('experts', { name, industry, domain, level, rating, intro, avatar: '' })
})

const demo = get(`SELECT id FROM users WHERE phone = ?`, ['13800000000'])
if (!demo) {
  insert('users', {
    nickname: '演示用户',
    phone: '13800000000',
    password_hash: hashPassword('123456'),
    company: '示例餐饮有限公司',
    industry: '餐饮/食品',
    role: 'HR'
  })
}

const counts = {
  values: all(`SELECT id FROM core_values WHERE is_preset = 1`).length,
  dimensions: all(`SELECT id FROM value_dimensions`).length,
  industries: all(`SELECT id FROM industries`).length,
  processes: all(`SELECT id FROM processes WHERE is_preset = 1`).length,
  nodes: all(`SELECT id FROM process_nodes`).length,
  stages: all(`SELECT id FROM stages`).length,
  experts: all(`SELECT id FROM experts`).length
}
console.log('[seed] done:', counts)
console.log('[seed] demo account: 13800000000 / 123456')
