<template>
  <div>
    <div class="steps">
      <div class="step done"><span class="step-num">✓</span>基本信息与价值观</div>
      <div class="step done"><span class="step-num">✓</span>经营与文化现状</div>
      <div class="step on"><span class="step-num">3</span>高管/员工测评</div>
      <div class="step"><span class="step-num">4</span>诊断报告</div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div>加载问卷…</div>
    <template v-else>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="tabs">
        <div class="tab" :class="{ on: tab === 'exec' }" @click="tab = 'exec'">高管行为测评</div>
        <div class="tab" :class="{ on: tab === 'emp' }" @click="tab = 'emp'">员工行为测评</div>
      </div>

      <div class="card">
        <div class="between mb">
          <div>
            <div class="card-title">{{ tab === 'exec' ? '高管行为测评' : '员工行为测评' }}</div>
            <div class="card-sub">
              测评方式：
              <span class="chips" style="display:inline-flex; margin-left:6px">
                <span
                  v-for="r in respondentOptions"
                  :key="r.value"
                  class="chip"
                  style="padding:4px 10px; font-size:12px"
                  :class="{ on: respondent === r.value }"
                  @click="respondent = r.value"
                >{{ r.label }}</span>
              </span>
            </div>
          </div>
          <span class="badge">{{ answeredCount }} / {{ questions.length }} 已答</span>
        </div>

        <div v-for="(group, gi) in grouped" :key="gi" class="node-block">
          <div class="node-title">{{ group.value }} · {{ group.dimension }}</div>
          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr>
                  <th style="width:60%">题目</th>
                  <th>评分</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="q in group.questions" :key="q.id">
                  <td>
                    {{ q.question }}
                    <div class="small muted">{{ q.scale }}</div>
                  </td>
                  <td>
                    <div class="row" style="gap:6px">
                      <span
                        v-for="n in 5"
                        :key="n"
                        class="chip"
                        style="width:34px; text-align:center; padding:5px 0"
                        :class="{ on: scores[key(q.id)] === n }"
                        @click="scores[key(q.id)] = n"
                      >{{ n }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="between mt">
          <span class="small muted">当前“{{ respondentLabel }}”已答 {{ answeredCount }} 题</span>
          <div class="row">
            <button class="btn" @click="saveCurrent(false)">保存草稿</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveCurrent(true)">
              {{ saving ? '提交中…' : '提交本部分' }}
            </button>
          </div>
        </div>
      </div>

      <div class="between">
        <button class="btn" @click="$router.push(`/diagnosis/${id}/self`)">上一步</button>
        <button class="btn btn-primary btn-lg" :disabled="generating" @click="generateReport">
          {{ generating ? '生成诊断报告中…' : '生成诊断报告' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(true)
const saving = ref(false)
const generating = ref(false)
const error = ref('')
const tab = ref('exec')
const respondent = ref('exec_self')
const questions = ref([])
const scores = reactive({})

const respondentOptions = computed(() =>
  tab.value === 'exec'
    ? [
        { value: 'exec_self', label: '高管自评' },
        { value: 'exec_other', label: '下属评高管' }
      ]
    : [
        { value: 'emp_self', label: '员工自评' },
        { value: 'emp_other', label: '主管评员工' }
      ]
)
const respondentLabel = computed(
  () => (respondentOptions.value.find((r) => r.value === respondent.value) || {}).label || ''
)

const key = (qid) => `${qid}:${respondent.value}`

const grouped = computed(() => {
  const map = []
  const index = {}
  questions.value.forEach((q) => {
    const k = `${q.value_name}||${q.value_dimension}`
    if (index[k] === undefined) {
      index[k] = map.length
      map.push({ value: q.value_name, dimension: q.value_dimension, questions: [] })
    }
    map[index[k]].questions.push(q)
  })
  return map
})

const answeredCount = computed(
  () => questions.value.filter((q) => scores[key(q.id)] !== undefined).length
)

watch(tab, (v) => {
  respondent.value = v === 'exec' ? 'exec_self' : 'emp_self'
  loadQuestions()
})

async function loadQuestions() {
  loading.value = true
  try {
    const data = await api.get(`/diagnoses/${id}/questions?target=${tab.value}`)
    questions.value = data.questions
    Object.entries(data.answers || {}).forEach(([k, v]) => {
      scores[k] = v
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveCurrent(next) {
  saving.value = true
  error.value = ''
  try {
    const answers = questions.value
      .filter((q) => scores[key(q.id)] !== undefined)
      .map((q) => ({ question_id: q.id, score: scores[key(q.id)] }))
    await api.post(`/diagnoses/${id}/answers`, { respondent_type: respondent.value, answers })
    if (next && tab.value === 'exec') {
      tab.value = 'emp'
    } else if (next) {
      error.value = ''
    }
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function generateReport() {
  generating.value = true
  error.value = ''
  try {
    await api.post(`/diagnoses/${id}/report`, {})
    router.push(`/diagnosis/${id}/report`)
  } catch (e) {
    error.value = e.message
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  await loadQuestions()
  const data = await api.get(`/diagnoses/${id}/questions?target=emp`)
  Object.entries(data.answers || {}).forEach(([k, v]) => {
    scores[k] = v
  })
})
</script>
