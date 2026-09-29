const path = require('node:path')
const fs = require('node:fs')
const express = require('express')
const cors = require('cors')

const envPath = path.join(__dirname, '..', '..', '.env')
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath)
  } catch (err) {
    console.warn('[env] failed to load .env:', err.message)
  }
}

const { init } = require('./lib/db')
init()

const authRoutes = require('./routes/auth')
const catalogRoutes = require('./routes/catalog')
const companyRoutes = require('./routes/companies')
const diagnosisRoutes = require('./routes/diagnosis')
const generationRoutes = require('./routes/generation')
const miscRoutes = require('./routes/misc')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'culture2action' }))

app.use('/api/auth', authRoutes)
app.use('/api/diagnoses', diagnosisRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api', catalogRoutes)
app.use('/api', generationRoutes)
app.use('/api', miscRoutes)

const distDir = path.join(__dirname, '..', '..', 'web', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  res.status(500).json({ error: err.message || '服务器内部错误' })
})

const PORT = Number(process.env.PORT || 3001)
app.listen(PORT, () => {
  console.log(`[culture2action] server running on http://localhost:${PORT}`)
})
