const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_MODEL = 'deepseek-chat'

function config() {
  const apiKey = process.env.USER_LLM_API_KEY || ''
  const baseUrl = (process.env.USER_LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
  const model = process.env.USER_LLM_MODEL || DEFAULT_MODEL
  const disabled = String(process.env.USE_RULE_ENGINE || '').toLowerCase() === 'true'
  return { apiKey, baseUrl, model, disabled }
}

function isLLMEnabled() {
  const { apiKey, disabled } = config()
  return !disabled && !!apiKey
}

async function chat(messages, options = {}) {
  if (!isLLMEnabled()) return null
  const { baseUrl, model, apiKey } = config()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout || 60000)
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        response_format: options.json ? { type: 'json_object' } : undefined
      }),
      signal: controller.signal
    })
    if (!res.ok) {
      console.warn(`[llm] request failed: ${res.status}`)
      return null
    }
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? null
  } catch (err) {
    console.warn(`[llm] error: ${err.message}`)
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function chatJSON(messages, options = {}) {
  const raw = await chat(messages, { ...options, json: true })
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

module.exports = { chat, chatJSON, isLLMEnabled, config }
