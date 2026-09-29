<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="between mb">
      <p class="muted small" style="margin:0">自建行业流程模板，支持自定义导入。换行业只需换流程，价值观与行为拆解逻辑复用。</p>
      <button class="btn btn-primary" @click="showForm = !showForm">{{ showForm ? '收起' : '导入自定义流程' }}</button>
    </div>

    <div v-if="showForm" class="card">
      <div class="card-title">导入自定义流程</div>
      <div class="grid grid-2">
        <div class="field">
          <label class="label">流程名称<span class="req">*</span></label>
          <input v-model="form.name" placeholder="如：我司产品部门流程" />
        </div>
        <div class="field">
          <label class="label">所属行业</label>
          <select v-model="form.industry_id">
            <option value="">请选择</option>
            <option v-for="i in industries" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">部门</label>
          <input v-model="form.department" placeholder="如：产品部门" />
        </div>
      </div>
      <div class="field">
        <label class="label">流程节点（每行一个）<span class="req">*</span></label>
        <textarea v-model="form.text" rows="7" placeholder="用户定位&#10;用户调研&#10;产品设计&#10;用户反馈"></textarea>
        <div class="hint">支持格式：节点名称 或 节点名称：说明。可直接从 Excel/文档粘贴一列节点。</div>
      </div>
      <div class="row">
        <button class="btn btn-primary" :disabled="saving" @click="importProcess">{{ saving ? '导入中…' : '导入' }}</button>
        <button class="btn" @click="showForm = false">取消</button>
      </div>
    </div>

    <div class="grid grid-2">
      <div v-for="p in processes" :key="p.id" class="card">
        <div class="between">
          <div>
            <div class="card-title" style="margin:0">{{ p.name }}</div>
            <div class="small muted">{{ p.industry_name }} · {{ p.department }}</div>
          </div>
          <span class="badge" :class="p.is_preset ? '' : 'badge-orange'">{{ p.is_preset ? '行业模板' : '自定义' }}</span>
        </div>
        <p class="small muted mt">{{ p.description }}</p>
        <div class="row mt">
          <span v-for="(n, i) in nodesByProcess[p.id]" :key="n.id" class="badge badge-gray">{{ i + 1 }}. {{ n.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '../api'

const processes = ref([])
const industries = ref([])
const nodesByProcess = reactive({})
const showForm = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ name: '', industry_id: '', department: '', text: '' })

async function load() {
  processes.value = await api.get('/processes')
  for (const p of processes.value) {
    const detail = await api.get(`/processes/${p.id}`)
    nodesByProcess[p.id] = detail.nodes
  }
}

onMounted(async () => {
  try {
    industries.value = await api.get('/industries')
    await load()
  } catch (e) {
    error.value = e.message
  }
})

async function importProcess() {
  error.value = ''
  if (!form.name || !form.text.trim()) {
    error.value = '请填写流程名称和节点'
    return
  }
  saving.value = true
  try {
    await api.post('/processes/import', {
      name: form.name,
      industry_id: form.industry_id || null,
      department: form.department,
      text: form.text
    })
    form.name = ''
    form.department = ''
    form.text = ''
    showForm.value = false
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
