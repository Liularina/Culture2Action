<template>
  <div>
    <div class="steps">
      <div class="step on"><span class="step-num">1</span>基本信息与价值观</div>
      <div class="step"><span class="step-num">2</span>经营与文化现状</div>
      <div class="step"><span class="step-num">3</span>高管/员工测评</div>
      <div class="step"><span class="step-num">4</span>诊断报告</div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card">
      <div class="card-title">第一部分：基本信息</div>
      <div class="card-sub">用于判断企业所处发展阶段，信息越完整，诊断越准确</div>
      <div class="grid grid-2">
        <div class="field">
          <label class="label">公司名称</label>
          <input v-model="form.name" placeholder="可匿名，如“某餐饮公司”" />
        </div>
        <div class="field">
          <label class="label">所属行业<span class="req">*</span></label>
          <select v-model="form.industry">
            <option value="">请选择</option>
            <option v-for="i in industries" :key="i.id" :value="i.name">{{ i.name }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">员工人数<span class="req">*</span></label>
          <select v-model="form.size">
            <option value="">请选择</option>
            <option v-for="s in sizeOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">成立年限<span class="req">*</span></label>
          <select v-model="form.years">
            <option value="">请选择</option>
            <option v-for="s in yearOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">当前发展阶段</label>
          <select v-model="form.stage">
            <option value="">不填，由系统辅助判断</option>
            <option v-for="s in stages" :key="s.code" :value="s.code">{{ s.code }} {{ s.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">选择要诊断的价值观<span class="req">*</span></div>
      <div class="card-sub">可多选。系统会按所选价值观的子维度生成高管与员工测评题</div>
      <div class="chips">
        <div
          v-for="v in values"
          :key="v.id"
          class="chip"
          :class="{ on: selectedValues.includes(v.id) }"
          @click="toggleValue(v.id)"
        >
          {{ v.name }}
          <span class="small muted">（{{ v.dimensions.length }}维）</span>
        </div>
      </div>
    </div>

    <div class="between">
      <span class="small muted">已选 {{ selectedValues.length }} 个价值观，约 {{ questionCount }} 道测评题</span>
      <button class="btn btn-primary btn-lg" :disabled="loading" @click="start">
        {{ loading ? '创建中…' : '下一步：填写经营与文化现状' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const industries = ref([])
const values = ref([])
const stages = ref([])
const selectedValues = ref([])
const loading = ref(false)
const error = ref('')

const sizeOptions = ['1-30人', '30-200人', '200-2000人', '2000人+']
const yearOptions = ['0-3年', '3-10年', '10-20年', '20年+']

const form = reactive({
  name: '',
  industry: '',
  size: '',
  years: '',
  stage: '',
  revenue_trend: '',
  focus: '',
  structure: '',
  culture_status: '',
  culture_clarity: ''
})

const questionCount = computed(() => {
  let dims = 0
  values.value.forEach((v) => {
    if (selectedValues.value.includes(v.id)) dims += v.dimensions.length
  })
  return dims * 10
})

onMounted(async () => {
  const [ind, vals, st] = await Promise.all([api.get('/industries'), api.get('/values'), api.get('/stages')])
  industries.value = ind
  values.value = vals
  stages.value = st
  const presets = vals.filter((v) => v.is_preset).slice(0, 2).map((v) => v.id)
  selectedValues.value = presets
})

function toggleValue(id) {
  const idx = selectedValues.value.indexOf(id)
  if (idx >= 0) selectedValues.value.splice(idx, 1)
  else selectedValues.value.push(id)
}

async function start() {
  error.value = ''
  if (!form.industry || !form.size || !form.years) {
    error.value = '请填写行业、员工人数、成立年限'
    return
  }
  if (!selectedValues.value.length) {
    error.value = '请至少选择一个价值观'
    return
  }
  loading.value = true
  try {
    const company = await api.post('/companies', { ...form })
    const diagnosis = await api.post('/diagnoses', {
      company_id: company.id,
      name: `${form.name || '企业'}文化诊断`,
      value_ids: selectedValues.value
    })
    router.push(`/diagnosis/${diagnosis.id}/self`)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
