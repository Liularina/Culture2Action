<template>
  <div class="auth-card">
    <div class="auth-brand">
      <div class="brand-logo" style="margin: 0 auto">C2</div>
      <h1>文化落地引擎</h1>
      <p>把价值观变成可执行、可观察、可培训的具体行动</p>
    </div>

    <div class="tabs">
      <div class="tab" :class="{ on: mode === 'login' }" @click="mode = 'login'">登录</div>
      <div class="tab" :class="{ on: mode === 'register' }" @click="mode = 'register'">注册</div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <form @submit.prevent="submit">
      <template v-if="mode === 'register'">
        <div class="field">
          <label class="label">昵称<span class="req">*</span></label>
          <input v-model="form.nickname" placeholder="请输入昵称" />
        </div>
      </template>
      <div class="field">
        <label class="label">手机号<span class="req">*</span></label>
        <input v-model="form.phone" placeholder="请输入手机号" />
      </div>
      <div class="field">
        <label class="label">密码<span class="req">*</span></label>
        <input v-model="form.password" type="password" placeholder="请输入密码" />
      </div>
      <template v-if="mode === 'register'">
        <div class="field">
          <label class="label">企业名称</label>
          <input v-model="form.company" placeholder="选填" />
        </div>
        <div class="field">
          <label class="label">所属行业</label>
          <select v-model="form.industry">
            <option value="">请选择</option>
            <option v-for="i in industries" :key="i.id" :value="i.name">{{ i.name }}</option>
          </select>
        </div>
      </template>
      <button class="btn btn-primary btn-lg btn-block" :disabled="loading">
        {{ loading ? '处理中…' : mode === 'login' ? '登录' : '注册并进入' }}
      </button>
    </form>

    <div class="auth-switch">
      <span class="muted small">演示账号：13800000000 / 123456</span>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api'
import { store } from '../store'

const router = useRouter()
const route = useRoute()
const mode = ref('login')
const loading = ref(false)
const error = ref('')
const industries = ref([])
const form = reactive({ nickname: '', phone: '', password: '', company: '', industry: '' })

onMounted(async () => {
  try {
    industries.value = await api.get('/industries')
  } catch (e) {
    /* ignore */
  }
})

async function submit() {
  error.value = ''
  if (!form.phone || !form.password || (mode.value === 'register' && !form.nickname)) {
    error.value = '请填写必填项'
    return
  }
  loading.value = true
  try {
    const data =
      mode.value === 'login'
        ? await api.post('/auth/login', { phone: form.phone, password: form.password })
        : await api.post('/auth/register', { ...form })
    store.setAuth(data.token, data.user)
    router.push(route.query.redirect || '/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
