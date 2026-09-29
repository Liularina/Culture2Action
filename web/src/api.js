import { store } from './store'

const BASE = '/api'

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (store.token) headers.Authorization = `Bearer ${store.token}`
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 401 && !path.startsWith('/auth')) {
    store.logout()
    if (location.hash !== '#/login') location.hash = '#/login'
  }
  if (raw) return res
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`)
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),

  async download(path, filename) {
    const headers = {}
    if (store.token) headers.Authorization = `Bearer ${store.token}`
    const res = await fetch(BASE + path, { headers })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || '下载失败')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  async downloadPost(path, body, filename) {
    const headers = { 'Content-Type': 'application/json' }
    if (store.token) headers.Authorization = `Bearer ${store.token}`
    const res = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || '下载失败')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}
