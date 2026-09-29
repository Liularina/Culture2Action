import { reactive } from 'vue'

export const store = reactive({
  token: localStorage.getItem('c2a_token') || '',
  user: JSON.parse(localStorage.getItem('c2a_user') || 'null'),
  setAuth(token, user) {
    this.token = token
    this.user = user
    localStorage.setItem('c2a_token', token)
    localStorage.setItem('c2a_user', JSON.stringify(user))
  },
  setUser(user) {
    this.user = user
    localStorage.setItem('c2a_user', JSON.stringify(user))
  },
  logout() {
    this.token = ''
    this.user = null
    localStorage.removeItem('c2a_token')
    localStorage.removeItem('c2a_user')
  }
})
