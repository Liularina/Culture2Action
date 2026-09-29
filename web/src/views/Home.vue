<template>
  <div>
    <div v-if="loading" class="loading"><div class="spinner"></div>加载中…</div>
    <template v-else>
      <div class="card" style="background: linear-gradient(120deg,#1f3a93,#3d2b91); color:#fff">
        <div class="between">
          <div>
            <h2 style="margin:0 0 6px; font-size:20px">你好，{{ store.user?.nickname }} 👋</h2>
            <p style="margin:0; opacity:.85" class="small">
              企业诊断 + 阶段判断 + 价值观 + 业务流程 + 行业场景 = 具体行为 + 培训课件 + 落地方案
            </p>
          </div>
          <button class="btn btn-lg" @click="$router.push('/diagnosis/start')">发起企业诊断</button>
        </div>
      </div>

      <div class="grid grid-4 mb">
        <div class="stat"><div class="stat-num">{{ data.counts.projects }}</div><div class="stat-label">我的项目</div></div>
        <div class="stat"><div class="stat-num">{{ data.counts.diagnoses }}</div><div class="stat-label">诊断次数</div></div>
        <div class="stat"><div class="stat-num">{{ data.counts.courses }}</div><div class="stat-label">已生成课件</div></div>
        <div class="stat"><div class="stat-num">{{ data.counts.reviews }}</div><div class="stat-label">专家审核</div></div>
      </div>

      <div class="grid grid-3 mb">
        <div class="card pointer" @click="$router.push('/diagnosis/start')">
          <div class="card-title">⊕ 完整诊断到课件</div>
          <div class="card-sub">现状自述 → 高管/员工测评 → 诊断报告 → 行为拆解 → 课件导出</div>
          <span class="badge">推荐</span>
        </div>
        <div class="card pointer" @click="$router.push('/decompose')">
          <div class="card-title">⊞ 快速行为拆解</div>
          <div class="card-sub">选择价值观 + 行业流程 + 企业阶段，一键生成每个节点的具体行动</div>
        </div>
        <div class="card pointer" @click="$router.push('/courses')">
          <div class="card-title">▤ 课件生成与导出</div>
          <div class="card-sub">行动清单自动转成案例、讨论题、角色扮演脚本、考核点</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="between mb">
            <div class="card-title">最近诊断</div>
            <button class="btn btn-sm" @click="$router.push('/diagnosis/start')">新建</button>
          </div>
          <div v-if="!data.recent_diagnoses.length" class="empty"><div class="empty-icon">◎</div>还没有诊断记录</div>
          <div
            v-for="d in data.recent_diagnoses"
            :key="d.id"
            class="list-item pointer"
            @click="$router.push(`/diagnosis/${d.id}/${d.status === 'completed' ? 'report' : 'self'}`)"
          >
            <div class="between">
              <strong>{{ d.name }}</strong>
              <span class="badge" :class="d.status === 'completed' ? 'badge-green' : 'badge-orange'">
                {{ d.status === 'completed' ? '已完成' : '进行中' }}
              </span>
            </div>
            <div class="small muted">{{ d.company_name }} · {{ d.created_at }}</div>
          </div>
        </div>

        <div class="card">
          <div class="between mb">
            <div class="card-title">最近课件</div>
            <button class="btn btn-sm" @click="$router.push('/courses')">查看全部</button>
          </div>
          <div v-if="!data.recent_courses.length" class="empty"><div class="empty-icon">▤</div>还没有课件</div>
          <div
            v-for="c in data.recent_courses"
            :key="c.id"
            class="list-item pointer"
            @click="$router.push(`/courses/${c.id}`)"
          >
            <div>{{ c.title }}</div>
            <div class="small muted">{{ c.stage }} · {{ c.created_at }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { store } from '../store'

const loading = ref(true)
const data = ref({ counts: { projects: 0, diagnoses: 0, courses: 0, reviews: 0 }, recent_diagnoses: [], recent_courses: [], recent_projects: [] })

onMounted(async () => {
  try {
    data.value = await api.get('/home')
  } finally {
    loading.value = false
  }
})
</script>
