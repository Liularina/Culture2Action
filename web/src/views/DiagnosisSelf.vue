<template>
  <div>
    <div class="steps">
      <div class="step done"><span class="step-num">✓</span>基本信息与价值观</div>
      <div class="step on"><span class="step-num">2</span>经营与文化现状</div>
      <div class="step"><span class="step-num">3</span>高管/员工测评</div>
      <div class="step"><span class="step-num">4</span>诊断报告</div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <template v-else>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="card">
        <div class="card-title">第二部分：经营现状</div>
        <div class="card-sub">{{ company.name }} · {{ company.industry }} · {{ company.size }}</div>
        <div class="field">
          <label class="label">最近一年营收趋势</label>
          <div class="chips">
            <div v-for="o in ['增长', '持平', '下滑']" :key="o" class="chip" :class="{ on: form.revenue_trend === o }" @click="form.revenue_trend = o">{{ o }}</div>
          </div>
        </div>
        <div class="field">
          <label class="label">当前最关注的问题</label>
          <div class="chips">
            <div v-for="o in ['活下去', '扩张', '提效', '转型', '其他']" :key="o" class="chip" :class="{ on: form.focus === o }" @click="form.focus = o">{{ o }}</div>
          </div>
        </div>
        <div class="field">
          <label class="label">组织架构</label>
          <div class="chips">
            <div v-for="o in ['扁平', '层级', '矩阵']" :key="o" class="chip" :class="{ on: form.structure === o }" @click="form.structure = o">{{ o }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">第三部分：文化现状</div>
        <div class="field">
          <label class="label">是否有明确的价值观？</label>
          <div class="chips">
            <div v-for="o in ['有', '没有', '有但不清晰']" :key="o" class="chip" :class="{ on: form.culture_status === o }" @click="form.culture_status = o">{{ o }}</div>
          </div>
        </div>
        <div class="field">
          <label class="label">价值观是否被员工知道？</label>
          <div class="chips">
            <div v-for="o in ['全员知道', '部分知道', '不知道']" :key="o" class="chip" :class="{ on: form.culture_clarity === o }" @click="form.culture_clarity = o">{{ o }}</div>
          </div>
        </div>
        <div class="field">
          <label class="label">文化落地最大的困难是什么？</label>
          <textarea v-model="form.pain_points" placeholder="例如：价值观挂在墙上，员工行为没有变化"></textarea>
        </div>
      </div>

      <div class="card">
        <div class="card-title">第四部分：痛点描述</div>
        <div class="field">
          <label class="label">请描述一个最近发生的、与文化有关的具体事件</label>
          <textarea v-model="form.event_desc" placeholder="描述事件经过、涉及的人和部门、结果"></textarea>
        </div>
        <div class="field">
          <label class="label">这个事件反映了什么问题？</label>
          <textarea v-model="form.event_problem" placeholder="例如：员工知道要客户导向，但没人跟进客户反馈"></textarea>
        </div>
      </div>

      <div class="between">
        <button class="btn" @click="$router.push(`/diagnosis/${id}/assessment`)">跳过</button>
        <button class="btn btn-primary btn-lg" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存并进入行为测评' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const company = ref({})
const form = reactive({
  revenue_trend: '',
  focus: '',
  structure: '',
  culture_status: '',
  culture_clarity: '',
  pain_points: '',
  event_desc: '',
  event_problem: ''
})

onMounted(async () => {
  try {
    const diagnosis = await api.get(`/diagnoses/${id}`)
    company.value = diagnosis.company || {}
    Object.keys(form).forEach((k) => {
      form[k] = company.value[k] || ''
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await api.put(`/companies/${company.value.id}`, { ...form })
    router.push(`/diagnosis/${id}/assessment`)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
