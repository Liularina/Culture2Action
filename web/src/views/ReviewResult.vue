<template>
  <div>
    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <template v-else-if="review">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div class="card">
        <div class="between">
          <div>
            <div class="card-title">{{ review.title }}</div>
            <div class="small muted">审核对象：{{ review.target_type === 'course' ? '培训课件' : review.target_type === 'diagnosis' ? '诊断报告' : '行为清单' }} · {{ review.created_at }}</div>
          </div>
          <span class="badge" :class="review.status === 'completed' ? 'badge-green' : 'badge-orange'">{{ review.status === 'completed' ? '已审核' : '审核中' }}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">审核专家</div>
        <div class="row">
          <div class="avatar">{{ (review.expert_name || '专').slice(0, 1) }}</div>
          <div>
            <div><strong>{{ review.expert_name || '待匹配专家' }}</strong> <span class="badge">{{ review.expert_level }}</span></div>
            <div class="small muted">{{ review.expert_industry }}</div>
          </div>
        </div>
      </div>

      <div v-if="review.status !== 'completed'" class="card" style="text-align:center">
        <p class="muted">专家正在审核中。演示环境可点击下方按钮生成审核结果。</p>
        <button class="btn btn-primary" :disabled="loadingAction" @click="complete">
          {{ loadingAction ? '生成中…' : '查看审核结果' }}
        </button>
      </div>

      <template v-else>
        <div class="card" style="text-align:center">
          <div class="small muted">审核评分</div>
          <div class="price-amount">{{ review.score }}<small>/5</small></div>
        </div>
        <div class="card">
          <div class="card-title">总体评价</div>
          <p class="pre-wrap">{{ review.comment }}</p>
        </div>
        <div class="card">
          <div class="card-title">修改建议</div>
          <div v-for="(s, i) in review.suggestions" :key="i" class="action-item">{{ i + 1 }}. {{ s }}</div>
        </div>
        <div class="card">
          <div class="card-title">对本次审核评分</div>
          <div class="row">
            <span v-for="n in 5" :key="n" class="chip" :class="{ on: rating >= n }" @click="rating = n">★</span>
            <button class="btn btn-sm" @click="feedback">提交</button>
            <span v-if="feedbackDone" class="badge badge-green">已记录</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const id = route.params.id
const loading = ref(true)
const loadingAction = ref(false)
const error = ref('')
const review = ref(null)
const rating = ref(5)
const feedbackDone = ref(false)

async function load() {
  review.value = await api.get(`/reviews/${id}`)
}

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function complete() {
  loadingAction.value = true
  try {
    review.value = await api.post(`/reviews/${id}/complete`, {})
  } catch (e) {
    error.value = e.message
  } finally {
    loadingAction.value = false
  }
}

async function feedback() {
  try {
    await api.post('/feedbacks', { target_type: 'review', target_id: Number(id), rating: rating.value, comment: '' })
    feedbackDone.value = true
  } catch (e) {
    error.value = e.message
  }
}
</script>
