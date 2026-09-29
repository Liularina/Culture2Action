<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="between mb">
      <p class="muted small" style="margin:0">行动清单自动转化为培训课件：案例、讨论题、角色扮演脚本、考核点。Word 优先，PPT 次之。</p>
      <div class="row">
        <button class="btn btn-sm" :disabled="!selected.length" @click="batchExport('word')">批量导出 Word</button>
        <button class="btn btn-sm" :disabled="!selected.length" @click="batchExport('ppt')">批量导出 PPT</button>
      </div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <div v-else-if="!courses.length" class="empty">
      <div class="empty-icon">▤</div>
      还没有课件，先去做行为拆解并生成课件
      <div class="mt"><button class="btn btn-primary" @click="$router.push('/decompose')">去行为拆解</button></div>
    </div>
    <div v-else class="card">
      <table>
        <thead>
          <tr>
            <th style="width:44px"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
            <th>课件标题</th>
            <th>阶段</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in courses" :key="c.id">
            <td><input type="checkbox" :value="c.id" v-model="selected" /></td>
            <td class="pointer" @click="$router.push(`/courses/${c.id}`)">{{ c.title }}</td>
            <td><span class="badge">{{ c.stage }}</span></td>
            <td class="small muted">{{ c.created_at }}</td>
            <td>
              <div class="row">
                <button class="btn btn-sm" @click="$router.push(`/courses/${c.id}`)">编辑</button>
                <button class="btn btn-sm" @click="exportOne(c.id, 'word')">Word</button>
                <button class="btn btn-sm" @click="exportOne(c.id, 'ppt')">PPT</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'

const courses = ref([])
const selected = ref([])
const loading = ref(true)
const error = ref('')
const allChecked = computed(() => courses.value.length > 0 && selected.value.length === courses.value.length)

async function load() {
  loading.value = true
  try {
    courses.value = await api.get('/courses')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

function toggleAll(e) {
  selected.value = e.target.checked ? courses.value.map((c) => c.id) : []
}

async function exportOne(id, format) {
  try {
    await api.download(`/courses/${id}/export?format=${format}`, `course-${id}.${format === 'ppt' ? 'pptx' : 'docx'}`)
  } catch (e) {
    error.value = e.message
  }
}

async function batchExport(format) {
  try {
    await api.downloadPost('/courses/export', { ids: selected.value, format }, `courses.${format === 'ppt' ? 'pptx' : 'docx'}`)
  } catch (e) {
    error.value = e.message
  }
}
</script>
