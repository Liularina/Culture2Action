<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="card">
      <div class="card-title">提交专家审核</div>
      <div class="card-sub">对 AI 生成的行为拆解或课件不放心？提交行业专家审核，获得专业背书</div>

      <div class="field">
        <label class="label">审核对象类型</label>
        <div class="chips">
          <div class="chip" :class="{ on: type === 'course' }" @click="setType('course')">培训课件</div>
          <div class="chip" :class="{ on: type === 'diagnosis' }" @click="setType('diagnosis')">诊断报告</div>
        </div>
      </div>

      <div class="field" v-if="type === 'course'">
        <label class="label">选择课件<span class="req">*</span></label>
        <select v-model.number="targetId">
          <option :value="0" disabled>请选择</option>
          <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
        </select>
      </div>
      <div class="field" v-else>
        <label class="label">选择诊断报告<span class="req">*</span></label>
        <select v-model.number="targetId">
          <option :value="0" disabled>请选择</option>
          <option v-for="d in diagnoses" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="field">
        <label class="label">选择专家</label>
        <div class="grid grid-2">
          <div
            v-for="e in experts"
            :key="e.id"
            class="list-item pointer"
            :style="expertId === e.id ? 'border-color: var(--primary); box-shadow: var(--shadow)' : ''"
            @click="expertId = e.id"
          >
            <div class="between">
              <strong>{{ e.name }}</strong>
              <span class="badge">{{ e.level }}</span>
            </div>
            <div class="small muted">{{ e.industry }} · {{ e.domain }}</div>
            <div class="small">评分 {{ e.rating }} · {{ e.intro }}</div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" :disabled="!targetId" @click="submit">提交并支付</button>
    </div>

    <PaymentDialog v-if="showPay" service="review" @paid="doSubmit" @cancel="showPay = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import PaymentDialog from '../components/PaymentDialog.vue'

const route = useRoute()
const router = useRouter()
const type = ref(route.query.type === 'diagnosis' ? 'diagnosis' : 'course')
const targetId = ref(route.query.id ? Number(route.query.id) : 0)
const expertId = ref(0)
const courses = ref([])
const diagnoses = ref([])
const experts = ref([])
const showPay = ref(false)
const error = ref('')

function setType(t) {
  type.value = t
  targetId.value = 0
}

onMounted(async () => {
  ;[courses.value, diagnoses.value, experts.value] = await Promise.all([
    api.get('/courses'),
    api.get('/diagnoses'),
    api.get('/experts')
  ])
  if (experts.value.length) expertId.value = experts.value[0].id
})

function submit() {
  if (!targetId.value) {
    error.value = '请选择审核对象'
    return
  }
  showPay.value = true
}

async function doSubmit() {
  showPay.value = false
  try {
    const review = await api.post('/reviews', {
      target_type: type.value,
      target_id: targetId.value,
      expert_id: expertId.value
    })
    router.push(`/reviews/${review.id}`)
  } catch (e) {
    error.value = e.message
  }
}
</script>
