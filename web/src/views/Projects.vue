<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="between mb">
      <p class="muted small" style="margin:0">每个项目保存价值观、流程与企业阶段，可一键换行业复用</p>
      <button class="btn btn-primary" @click="$router.push('/decompose')">新建拆解</button>
    </div>
    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <div v-else-if="!projects.length" class="empty"><div class="empty-icon">▣</div>还没有项目</div>
    <div v-else class="grid grid-3">
      <div v-for="p in projects" :key="p.id" class="card pointer" @click="$router.push(`/projects/${p.id}`)">
        <div class="card-title" style="margin:0">{{ p.name }}</div>
        <div class="small muted">{{ p.department }} · {{ p.stage }}</div>
        <div class="small mt">价值观：{{ p.value_ids.length }} 个</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const projects = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    projects.value = await api.get('/projects')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>
