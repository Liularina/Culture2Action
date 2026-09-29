<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="between mb">
      <p class="muted small" style="margin:0">预置 10 个常见价值观，支持自定义价值观与子维度。价值观可复用，换行业流程即可。</p>
      <button class="btn btn-primary" @click="showForm = !showForm">{{ showForm ? '收起' : '新增自定义价值观' }}</button>
    </div>

    <div v-if="showForm" class="card">
      <div class="card-title">新增价值观</div>
      <div class="field">
        <label class="label">名称<span class="req">*</span></label>
        <input v-model="form.name" placeholder="如：奋斗者精神" />
      </div>
      <div class="field">
        <label class="label">说明</label>
        <input v-model="form.description" placeholder="一句话说明这个价值观强调什么" />
      </div>
      <div class="field">
        <label class="label">子维度（每行一个，最多5个）</label>
        <textarea v-model="form.dimensionsText" placeholder="例如：&#10;主动担当：主动承担超出职责的事&#10;长期投入：为长期目标持续投入"></textarea>
        <div class="hint">格式：子维度名称：说明</div>
      </div>
      <div class="row">
        <button class="btn btn-primary" :disabled="saving" @click="create">{{ saving ? '保存中…' : '保存' }}</button>
        <button class="btn" @click="showForm = false">取消</button>
      </div>
    </div>

    <div class="grid grid-3">
      <div v-for="v in values" :key="v.id" class="card">
        <div class="between">
          <div class="card-title" style="margin:0">{{ v.name }}</div>
          <span class="badge" :class="v.is_preset ? '' : 'badge-orange'">{{ v.is_preset ? '预置' : '自定义' }}</span>
        </div>
        <div class="small muted mb">{{ v.description }}</div>
        <div class="chips">
          <span v-for="d in v.dimensions" :key="d.id" class="badge badge-gray">{{ d.name }}</span>
        </div>
        <div class="small muted mt">{{ v.dimensions.length }} 个子维度</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '../api'

const values = ref([])
const showForm = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ name: '', description: '', dimensionsText: '' })

async function load() {
  values.value = await api.get('/values')
}

onMounted(load)

async function create() {
  error.value = ''
  if (!form.name) {
    error.value = '请填写价值观名称'
    return
  }
  const dimensions = form.dimensionsText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((line) => {
      const [name, ...rest] = line.split(/[:：]/)
      return { name: name.trim(), description: rest.join(':').trim() }
    })
  if (!dimensions.length) {
    error.value = '请至少填写一个子维度'
    return
  }
  saving.value = true
  try {
    await api.post('/values', { name: form.name, description: form.description, dimensions })
    form.name = ''
    form.description = ''
    form.dimensionsText = ''
    showForm.value = false
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
