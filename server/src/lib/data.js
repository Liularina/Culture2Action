const { all, get } = require('./db')

function listValues(userId) {
  const values = all(
    `SELECT * FROM core_values WHERE is_preset = 1 OR user_id = ? ORDER BY is_preset DESC, id ASC`,
    [userId || 0]
  )
  return values.map((v) => ({
    ...v,
    dimensions: all(
      `SELECT * FROM value_dimensions WHERE value_id = ? ORDER BY id ASC`,
      [v.id]
    )
  }))
}

function getValue(valueId, userId) {
  const v = get(`SELECT * FROM core_values WHERE id = ?`, [valueId])
  if (!v) return null
  return {
    ...v,
    dimensions: all(`SELECT * FROM value_dimensions WHERE value_id = ? ORDER BY id ASC`, [valueId])
  }
}

function listIndustries() {
  return all(`SELECT * FROM industries ORDER BY id ASC`)
}

function listProcesses(industryId, userId) {
  let sql = `SELECT p.*, i.name AS industry_name FROM processes p
             LEFT JOIN industries i ON i.id = p.industry_id
             WHERE (p.is_preset = 1 OR p.user_id = ?)`
  const params = [userId || 0]
  if (industryId) {
    sql += ` AND p.industry_id = ?`
    params.push(industryId)
  }
  sql += ` ORDER BY p.is_preset DESC, p.id ASC`
  return all(sql, params)
}

function getProcess(processId) {
  const proc = get(
    `SELECT p.*, i.name AS industry_name FROM processes p
     LEFT JOIN industries i ON i.id = p.industry_id WHERE p.id = ?`,
    [processId]
  )
  if (!proc) return null
  proc.nodes = all(`SELECT * FROM process_nodes WHERE process_id = ? ORDER BY ordinal ASC`, [processId])
  return proc
}

function getNodesByIds(ids) {
  if (!ids || !ids.length) return []
  const placeholders = ids.map(() => '?').join(',')
  return all(
    `SELECT * FROM process_nodes WHERE id IN (${placeholders}) ORDER BY process_id, ordinal`,
    ids
  )
}

function listExperts() {
  return all(`SELECT * FROM experts ORDER BY rating DESC`)
}

function listStages() {
  return all(`SELECT * FROM stages ORDER BY code ASC`)
}

module.exports = {
  listValues,
  getValue,
  listIndustries,
  listProcesses,
  getProcess,
  getNodesByIds,
  listExperts,
  listStages
}
