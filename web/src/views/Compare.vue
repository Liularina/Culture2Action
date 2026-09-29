<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card">
      <div class="card-title">行业 / 阶段对比</div>
      <div class="card-sub">同一价值观，换行业流程或换企业阶段，自动重新拆解并对比差异</div>

      <div class="tabs" style="margin-top:8px">
        <div class="tab" :class="{ on: mode === 'industry' }" @click="mode = 'industry'">行业对比</div>
        <div class="tab" :class="{ on: mode === 'stage' }" @click="mode = 'stage'">阶段对比</div>
      </div>

      <div class="grid grid-2">
        <div class="field">
          <label class="label">价值观</label>
          <select v-model.number="valueId">
            <option v-for="v in values" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="field" v-if="mode === 'industry'">
          <label class="label">企业阶段</label>
          <select v-model="stageA">
            <option v-for="s in stages" :key="s.code" :value="s.code">{{ s.code }} {{ s.name }}</option>
          </select>
        </div>
        <div class="field" v-if="mode === 'industry'">
          <label class="label">流程A（原行业）</label>
          <select v-model.number="processA">
            <option v-for="p in processes" :key="p.id" :value="p.id">{{ p.industry_name }} · {{ p.name }}</option>
          </select>
        </div>
        <div class="field" v-if="mode === 'industry'">
          <label class="label">流程B（目标行业）</label>
          <select v-model.number="processB">
            <option v-for="p in processes" :key="p.id" :value="p.id">{{ p.industry_name }} · {{ p.name }}</option>
          </select>
        </div>
        <template v-if="mode === 'stage'">
          <div class="field">
            <label class="label">流程</label>
            <select v-model.number="processA">
              <option v-for="p in processes" :key="p.id" :value="p.id">{{ p.industry_name }} · {{ p.name }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">阶段B</label>
            <select v-model="stageB">
              <option v-for="s in stages" :key="s.code" :value="s.code">{{ s.code }} {{ s.name }}</option>
            </select>
          </div>
        </template>
      </div>
      <button class="btn btn-primary" :disabled="loading" @click="run">{{ loading ? '对比中…' : '开始对比' }}</button>
    </div>

    <div v-if="left && right" class="grid grid-2">
      <div class="card">
        <div class="card-title">{{ left.label }}</div>
        <div v-for="item in left.items" :key="item.node" class="list-item">
          <div style="font-weight:600">{{ item.node }}</div>
          <div v-for="(a, i) in item.actions" :key="i" class="small" style="margin-top:6px">· {{ a.action }}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">{{ right.label }}</div>
        <div v-for="item in right.items" :key="item.node" class="list-item">
          <div style="font-weight:600">{{ item.node }}</div>
          <div v-for="(a, i) in item.actions" :key="i" class="small" style="margin-top:6px">· {{ a.action }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const values = ref([])
const processes = ref([])
const stages = ref([])
const mode = ref('industry')
const valueId = ref(1)
const processA = ref(0)
const processB = ref(0)
const stageA = ref('S1')
const stageB = ref('S3')
const loading = ref(false)
const error = ref('')
const left = ref(null)
const right = ref(null)

onMounted(async () => {
  ;[values.value, processes.value, stages.value] = await Promise.all([
    api.get('/values'),
    api.get('/processes'),
    api.get('/stages')
  ])
  valueId.value = (values.value[0] || {}).id
  processA.value = (processes.value[0] || {}).id
  processB.value = (processes.value[1] || processes.value[0] || {}).id
})

function flatten(groups) {
  if (!groups || !groups[0]) return []
  return (groups[0].nodes || []).map((n) => ({ node: n.node, actions: n.actions }))
}

async function generate(processId, stage) {
  const data = await api.post('/actions/generate', {
    value_ids: [valueId.value],
    process_id: processId,
    stage,
    persist: false
  })
  return data
}

async function run() {
  error.value = ''
  loading.value = true
  try {
    const procA = processes.value.find((p) => p.id === processA.value)
    const procB = processes.value.find((p) => p.id === processB.value)
    if (mode.value === 'industry') {
      const [a, b] = await Promise.all([generate(processA.value, stageA.value), generate(processB.value, stageA.value)])
      left.value = { label: procA.industry_name + ' · ' + procA.name, items: flatten(a.groups) }
      right.value = { label: procB.industry_name + ' · ' + procB.name, items: flatten(b.groups) }
    } else {
      const [a, b] = await Promise.all([generate(processA.value, stageA.value), generate(processA.value, stageB.value)])
      left.value = { label: stageA.value + ' 阶段', items: flatten(a.groups) }
      right.value = { label: stageB.value + ' 阶段', items: flatten(b.groups) }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
