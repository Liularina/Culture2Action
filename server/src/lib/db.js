const { DatabaseSync } = require('node:sqlite')
const path = require('node:path')
const fs = require('node:fs')

const DATA_DIR = path.join(__dirname, '..', '..', 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'culture2action.db')

const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  avatar TEXT,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company TEXT,
  industry TEXT,
  role TEXT DEFAULT 'HR',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT,
  industry TEXT,
  size TEXT,
  years TEXT,
  stage TEXT,
  revenue_trend TEXT,
  focus TEXT,
  structure TEXT,
  culture_status TEXT,
  culture_clarity TEXT,
  pain_points TEXT,
  event_desc TEXT,
  event_problem TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS diagnoses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT DEFAULT 'full',
  status TEXT DEFAULT 'draft',
  name TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS diagnosis_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnosis_id INTEGER,
  type TEXT,
  value_dimension TEXT,
  value_name TEXT,
  question TEXT,
  target TEXT,
  scale TEXT,
  ordinal INTEGER,
  FOREIGN KEY(diagnosis_id) REFERENCES diagnoses(id)
);

CREATE TABLE IF NOT EXISTS diagnosis_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnosis_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  respondent_type TEXT,
  score INTEGER,
  comment TEXT,
  FOREIGN KEY(diagnosis_id) REFERENCES diagnoses(id),
  FOREIGN KEY(question_id) REFERENCES diagnosis_questions(id)
);

CREATE TABLE IF NOT EXISTS diagnosis_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnosis_id INTEGER NOT NULL,
  stage TEXT,
  stage_reason TEXT,
  maturity_score REAL,
  key_issues TEXT,
  priorities TEXT,
  recommendations TEXT,
  dimension_scores TEXT,
  gap_analysis TEXT,
  course_suggestions TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(diagnosis_id) REFERENCES diagnoses(id)
);

CREATE TABLE IF NOT EXISTS core_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_preset INTEGER DEFAULT 0,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS value_dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY(value_id) REFERENCES core_values(id)
);

CREATE TABLE IF NOT EXISTS industries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry_id INTEGER,
  department TEXT,
  name TEXT,
  description TEXT,
  is_preset INTEGER DEFAULT 0,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(industry_id) REFERENCES industries(id)
);

CREATE TABLE IF NOT EXISTS process_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_id INTEGER NOT NULL,
  ordinal INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY(process_id) REFERENCES processes(id)
);

CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value_id INTEGER,
  value_name TEXT,
  dimension_id INTEGER,
  dimension_name TEXT,
  node_id INTEGER,
  node_name TEXT,
  process_id INTEGER,
  industry_id INTEGER,
  stage TEXT,
  action TEXT,
  observable INTEGER DEFAULT 1,
  assessment TEXT,
  training_case TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  node_id INTEGER,
  value_id INTEGER,
  dimension_id INTEGER,
  stage TEXT,
  title TEXT,
  content_json TEXT,
  format TEXT DEFAULT 'word',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT,
  value_ids TEXT,
  process_id INTEGER,
  industry_id INTEGER,
  department TEXT,
  stage TEXT,
  diagnosis_id INTEGER,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS expert_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  title TEXT,
  content_snapshot TEXT,
  expert_id INTEGER,
  status TEXT DEFAULT 'pending',
  score REAL,
  comment TEXT,
  suggestions TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS experts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  avatar TEXT,
  industry TEXT,
  domain TEXT,
  level TEXT,
  rating REAL,
  intro TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  service_type TEXT,
  target_id INTEGER,
  amount REAL,
  status TEXT DEFAULT 'pending',
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  target_type TEXT,
  target_id INTEGER,
  rating INTEGER,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS stages (
  code TEXT PRIMARY KEY,
  name TEXT,
  size TEXT,
  years TEXT,
  features TEXT,
  keywords TEXT
);
`

function init() {
  db.exec(SCHEMA)
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params).map((row) => ({ ...row }))
}
function get(sql, params = []) {
  const row = db.prepare(sql).get(...params)
  return row ? { ...row } : null
}
function run(sql, params = []) {
  const info = db.prepare(sql).run(...params)
  return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) }
}
function insert(table, obj) {
  const keys = Object.keys(obj)
  const placeholders = keys.map(() => '?').join(',')
  const values = keys.map((k) => obj[k])
  const { lastInsertRowid } = run(
    `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
    values
  )
  return lastInsertRowid
}
function update(table, id, obj) {
  const keys = Object.keys(obj)
  const sets = keys.map((k) => `${k} = ?`).join(',')
  const values = keys.map((k) => obj[k])
  run(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...values, id])
}

module.exports = { db, init, all, get, run, insert, update, DB_PATH }
