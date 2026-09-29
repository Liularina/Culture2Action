<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="saved" class="alert alert-success">已保存</div>

    <div class="card">
      <div class="card-title">个人与账号</div>
      <div class="grid grid-2">
        <div class="field"><label class="label">昵称</label><input v-model="form.nickname" /></div>
        <div class="field"><label class="label">手机号</label><input :value="form.phone" disabled /></div>
        <div class="field"><label class="label">企业名称</label><input v-model="form.company" /></div>
        <div class="field"><label class="label">所属行业</label><input v-model="form.industry" /></div>
      </div>
      <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
    </div>

    <div class="card">
      <div class="card-title">AI 引擎状态</div>
      <div class="alert" :class="engine.llm_enabled ? 'alert-success' : 'alert-info'">
        {{ engine.llm_enabled ? `已接入大模型：${engine.model}` : '当前使用内置规则引擎（可完整运行）。配置你自己的大模型 Key 后可获得更丰富的内容。' }}
      </div>
      <p class="small muted">
        出于安全考虑，本平台不会读取或使用任何平台/环境预置的密钥。如需接入大模型，请在项目根目录创建 .env，并自行填写：
      </p>
      <pre class="action-item small">USER_LLM_API_KEY=你的Key
USER_LLM_BASE_URL=https://api.deepseek.com/v1
USER_LLM_MODEL=deepseek-chat</pre>
      <p class="small muted">未配置时，企业阶段判断、行为拆解、课件生成均由规则引擎完成，功能不受影响。</p>
    </div>

    <div class="card">
      <div class="card-title">我的反馈</div>
      <div v-if="!feedbacks.length" class="empty">暂无反馈</div>
      <table v-else>
        <thead><tr><th>对象</th><th>评分</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="f in feedbacks" :key="f.id">
            <td>{{ f.target_type }} #{{ f.target_id }}</td>
            <td>{{ '★'.repeat(f.rating) }}</td>
            <td class="small muted">{{ f.created_at }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { api } from '../api'
import { store } from '../store'

const form = reactive({ nickname: '', phone: '', company: '', industry: '' })
const engine = ref({ llm_enabled: false, model: '' })
const feedbacks = ref([])
const saving = ref(false)
const saved = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const me = await api.get('/auth/me')
    Object.assign(form, me)
    engine.value = await api.get('/engine')
    feedbacks.value = await api.get('/feedbacks')
  } catch (e) {
    error.value = e.message
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    const user = await api.put('/auth/me', {
      nickname: form.nickname,
      company: form.company,
      industry: form.industry
    })
    store.setUser(user)
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
