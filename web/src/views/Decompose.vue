<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card">
      <div class="card-title">行为拆解引擎</div>
      <div class="card-sub">价值观 × 流程节点 × 企业阶段 → 每个节点上可执行、可观察的具体行动</div>

      <div class="field">
        <label class="label">1. 选择价值观（可多选）<span class="req">*</span></label>
        <div class="chips">
          <div v-for="v in values" :key="v.id" class="chip" :class="{ on: selectedValues.includes(v.id) }" @click="toggle(selectedValues, v.id)">
            {{ v.name }}
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="field">
          <label class="label">2. 选择行业流程<span class="req">*</span></label>
          <select v-model.number="processId" @change="onProcessChange">
            <option :value="0" disabled>请选择流程</option>
            <option v-for="p in processes" :key="p.id" :value="p.id">{{ p.industry_name }} · {{ p.name }}</option>
          </select>
          <div class="hint" v-if="currentProcess">共 {{ currentProcess.nodes.length }} 个流程节点</div>
        </div>
        <div class="field">
          <label class="label">3. 企业阶段<span class="req">*</span></label>
          <select v-model="stage">
            <option value="">请选择</option>
            <option v-for="s in stages" :key="s.code" :value="s.code">{{ s.code }} {{ s.name }}（{{ s.size }}）</option>
          </select>
          <div class="hint" v-if="stageMeta">{{ stageMeta.tone }}</div>
        </div>
      </div>

      <div class="field" v-if="currentProcess">
        <label class="label">4. 选择流程节点（不选则默认全部）</label>
        <div class="chips">
          <div
            v-for="n in currentProcess.nodes"
            :key="n.id"
            class="chip"
            :class="{ on: selectedNodes.includes(n.id) }"
            @click="toggle(selectedNodes, n.id)"
          >{{ n.name }}</div>
        </div>
      </div>

      <div class="between mt">
        <span class="small muted">将生成 {{ selectedValues.length }} 个价值观在 {{ selectedNodes.length || (currentProcess ? currentProcess.nodes.length : 0) }} 个节点上的行为清单</span>
        <button class="btn btn-primary btn-lg" :disabled="loading" @click="generate">
          {{ loading ? '拆解中…' : '开始行为拆解' }}
        </button>
      </div>
    </div>

    <template v-if="groups.length">
      <div class="between mb">
        <h3 style="margin:0">{{ resultInfo.process }} · {{ resultInfo.stage }} 行为拆解结果</h3>
        <div class="row">
          <button class="btn" @click="saveProject">保存为项目</button>
        </div>
      </div>

      <div v-for="(g, gi) in groups" :key="gi" class="card">
        <div class="card-title">{{ g.value }} · {{ g.dimension }}</div>
        <div class="card-sub">{{ g.description }}</div>
        <div v-for="(node, ni) in g.nodes" :key="ni" class="node-block">
          <div class="between">
            <div class="node-title">{{ node.node }}</div>
            <button class="btn btn-sm btn-primary" @click="generateCourse(g, node)">生成该节点课件</button>
          </div>
          <div v-for="(a, ai) in node.actions" :key="ai" class="action-item">
            <div class="action-text">{{ ai + 1 }}. {{ a.action }}</div>
            <div class="small muted mt">评估标准：{{ a.assessment }}</div>
            <div class="small muted">案例：{{ a.case || a.training_case }}</div>
          </div>
        </div>
      </div>
    </template>

    <PaymentDialog
      v-if="showPay"
      service="actions"
      @paid="onPaid"
      @cancel="showPay = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import PaymentDialog from '../components/PaymentDialog.vue'

const route = useRoute()
const router = useRouter()
const values = ref([])
const processes = ref([])
const stages = ref([])
const selectedValues = ref([])
const selectedNodes = ref([])
const processId = ref(0)
const stage = ref('S2')
const loading = ref(false)
const error = ref('')
const groups = ref([])
const resultInfo = ref({ process: '', stage: '' })
const showPay = ref(false)
const paid = ref(false)

const currentProcess = computed(() => processes.value.find((p) => p.id === processId.value) || null)
const stageMeta = computed(() => stages.value.find((s) => s.code === stage.value) || null)

function toggle(list, id) {
  const idx = list.value.indexOf(id)
  if (idx >= 0) list.value.splice(idx, 1)
  else list.value.push(id)
}

function onProcessChange() {
  selectedNodes.value = []
}

onMounted(async () => {
  try {
    ;[values.value, processes.value, stages.value] = await Promise.all([
      api.get('/values'),
      api.get('/processes'),
      api.get('/stages')
    ])
    if (route.query.stage) stage.value = route.query.stage
    if (route.query.process_id) processId.value = Number(route.query.process_id)
    else if (processes.value.length) processId.value = processes.value[0].id
    if (route.query.values) {
      const names = String(route.query.values).split(',')
      selectedValues.value = values.value.filter((v) => names.includes(v.name)).map((v) => v.id)
    }
    if (!selectedValues.value.length && values.value.length) selectedValues.value = [values.value[0].id]
  } catch (e) {
    error.value = e.message
  }
})

async function generate() {
  error.value = ''
  if (!selectedValues.value.length || !processId.value || !stage.value) {
    error.value = '请选择价值观、行业流程和企业阶段'
    return
  }
  if (!paid.value) {
    showPay.value = true
    return
  }
  loading.value = true
  try {
    const data = await api.post('/actions/generate', {
      value_ids: selectedValues.value,
      process_id: processId.value,
      stage: stage.value,
      nodes: selectedNodes.value,
      persist: true
    })
    groups.value = data.groups
    resultInfo.value = { process: data.process.name, stage: data.stage }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function onPaid() {
  paid.value = true
  showPay.value = false
  generate()
}

async function generateCourse(group, node) {
  try {
    const course = await api.post('/courses/generate', {
      node_id: node.node_id,
      value_id: group.value_id,
      dimension_name: group.dimension,
      stage: stage.value,
      process_id: processId.value,
      actions: node.actions.map((a) => ({ action: a.action, assessment: a.assessment, training_case: a.case || a.training_case }))
    })
    router.push(`/courses/${course.id}`)
  } catch (e) {
    error.value = e.message
  }
}

async function saveProject() {
  try {
    await api.post('/projects', {
      name: `${resultInfo.value.process} · ${selectedValues.value.length}个价值观`,
      value_ids: selectedValues.value,
      process_id: processId.value,
      stage: stage.value
    })
    error.value = ''
    alert('已保存到我的项目')
  } catch (e) {
    error.value = e.message
  }
}
</script>
