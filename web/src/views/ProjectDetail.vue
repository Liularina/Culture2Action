<template>
  <div>
    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <template v-else-if="project">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div class="card">
        <div class="between">
          <div>
            <div class="card-title">{{ project.name }}</div>
            <div class="small muted">阶段 {{ project.stage }} · {{ project.department }}</div>
          </div>
          <button class="btn" @click="$router.push('/decompose')">继续拆解</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">跨行业复用</div>
        <div class="card-sub">同一套价值观，换一个行业流程，自动重新拆解并对比差异</div>
        <div class="grid grid-2">
          <div class="field">
            <label class="label">价值观</label>
            <select v-model.number="valueId">
              <option v-for="v in projectValues" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">目标行业流程</label>
            <select v-model.number="targetProcessId">
              <option v-for="p in processes" :key="p.id" :value="p.id">{{ p.industry_name }} · {{ p.name }}</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" :disabled="adapting" @click="adapt">{{ adapting ? '适配中…' : '生成行业适配版' }}</button>
      </div>

      <div v-if="adapted">
        <h3>适配结果：{{ adapted.target_industry }} · {{ adapted.target_process }}</h3>
        <div v-for="(g, gi) in adapted.groups" :key="gi" class="card">
          <div class="card-title">{{ g.dimension }}</div>
          <div v-for="(n, ni) in g.nodes" :key="ni" class="node-block">
            <div class="node-title">{{ n.node }}</div>
            <div v-for="(a, ai) in n.actions" :key="ai" class="action-item">
              <div class="action-text">{{ ai + 1 }}. {{ a.action }}</div>
              <div class="small muted">评估标准：{{ a.assessment }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const id = route.params.id
const loading = ref(true)
const adapting = ref(false)
const error = ref('')
const project = ref(null)
const values = ref([])
const processes = ref([])
const valueId = ref(0)
const targetProcessId = ref(0)
const adapted = ref(null)

const projectValues = computed(() => values.value.filter((v) => (project.value?.value_ids || []).includes(v.id)))

onMounted(async () => {
  try {
    ;[project.value, values.value, processes.value] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get('/values'),
      api.get('/processes')
    ])
    valueId.value = (projectValues.value[0] || {}).id || (values.value[0] || {}).id
    targetProcessId.value = (processes.value[0] || {}).id
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function adapt() {
  adapting.value = true
  error.value = ''
  try {
    adapted.value = await api.post('/actions/adapt', {
      value_id: valueId.value,
      stage: project.value.stage || 'S2',
      target_process_id: targetProcessId.value
    })
  } catch (e) {
    error.value = e.message
  } finally {
    adapting.value = false
  }
}
</script>
