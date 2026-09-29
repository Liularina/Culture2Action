<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="between mb">
      <p class="muted small" style="margin:0">关键内容可提交行业专家审核，提升专业度与可信度</p>
      <button class="btn btn-primary" @click="$router.push('/reviews/submit')">提交专家审核</button>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <div v-else-if="!reviews.length" class="empty"><div class="empty-icon">✓</div>还没有提交过审核</div>
    <div v-else class="card">
      <table>
        <thead><tr><th>审核对象</th><th>专家</th><th>状态</th><th>评分</th><th>提交时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="r in reviews" :key="r.id">
            <td>{{ r.title }}</td>
            <td>{{ r.expert_name || '待匹配' }}</td>
            <td><span class="badge" :class="r.status === 'completed' ? 'badge-green' : 'badge-orange'">{{ r.status === 'completed' ? '已审核' : '审核中' }}</span></td>
            <td>{{ r.score || '—' }}</td>
            <td class="small muted">{{ r.created_at }}</td>
            <td><button class="btn btn-sm" @click="$router.push(`/reviews/${r.id}`)">查看</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const reviews = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    reviews.value = await api.get('/reviews')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>
