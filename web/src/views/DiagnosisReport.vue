<template>
  <div>
    <div v-if="loading" class="loading"><div class="spinner"></div>生成中…</div>
    <template v-else-if="report">
      <div class="card" style="background: linear-gradient(120deg,#1f3a93,#3d2b91); color:#fff">
        <div class="between">
          <div>
            <div class="small" style="opacity:.8">企业阶段判断</div>
            <h2 style="margin:4px 0">{{ report.stage }} {{ stageName }}</h2>
            <p class="small" style="opacity:.85; margin:0">{{ report.stage_reason }}</p>
          </div>
          <div style="text-align:center">
            <div class="small" style="opacity:.8">文化成熟度</div>
            <div style="font-size:40px; font-weight:700">{{ report.maturity_score }}<span style="font-size:16px">/5</span></div>
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">关键问题清单</div>
          <div v-for="(issue, i) in report.key_issues" :key="i" class="list-item">
            <div class="between">
              <strong>{{ issue.value }} · {{ issue.dimension }}</strong>
              <span class="badge" :class="issue.type === '认知差距' ? 'badge-orange' : 'badge-red'">{{ issue.type }}</span>
            </div>
            <div class="small">{{ issue.desc }}</div>
          </div>
          <div v-if="!report.key_issues.length" class="empty">暂无问题</div>
        </div>

        <div class="card">
          <div class="card-title">价值观维度得分</div>
          <div v-for="d in report.dimension_scores" :key="d.value + d.dimension" style="margin-bottom:14px">
            <div class="between small">
              <span>{{ d.value }} · {{ d.dimension }}</span>
              <span>{{ d.combined }} / 5</span>
            </div>
            <div class="bar-wrap"><div class="bar" :style="{ width: (d.combined / 5 * 100) + '%' }"></div></div>
            <div class="small muted" v-if="d.gap !== null">高管 {{ d.exec }} · 员工 {{ d.emp }} · 差距 {{ d.gap }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">差距分析（自评 vs 他评）</div>
        <table v-if="report.gap_analysis.length">
          <thead><tr><th>价值观维度</th><th>高管</th><th>员工</th><th>差距</th></tr></thead>
          <tbody>
            <tr v-for="g in report.gap_analysis" :key="g.value + g.dimension">
              <td>{{ g.value }} · {{ g.dimension }}</td>
              <td>{{ g.exec }}</td>
              <td>{{ g.emp }}</td>
              <td><span class="badge" :class="Math.abs(g.gap) >= 1 ? 'badge-red' : 'badge-gray'">{{ g.gap }}</span></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">测评数据不足，暂无法计算差距</div>
      </div>

      <div class="card">
        <div class="card-title">建议优先关注</div>
        <div class="grid grid-3">
          <div v-for="(p, i) in report.priorities" :key="i" class="list-item">
            <div class="badge badge-orange">优先级 {{ i + 1 }}</div>
            <div style="font-weight:600; margin:6px 0">{{ p.value }} · {{ p.dimension }}</div>
            <div class="small muted">流程节点：{{ p.process_node }} · 阶段：{{ p.stage }} {{ p.stage_name }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">建议行动</div>
        <div v-for="(r, i) in report.recommendations" :key="i" class="action-item">
          <div class="action-text">{{ r.action }}</div>
          <div class="small muted mt">对应：{{ r.value }} · {{ r.dimension }} · {{ r.node }}</div>
        </div>
      </div>

      <div class="card">
        <div class="between mb">
          <div>
            <div class="card-title">推荐课件方向</div>
            <div class="card-sub">可直接进入行为拆解，生成课件</div>
          </div>
          <button class="btn btn-primary" @click="startDecompose">去生成行为拆解与课件</button>
        </div>
        <div class="grid grid-3">
          <div v-for="(c, i) in report.course_suggestions" :key="i" class="list-item">
            <div style="font-weight:600">{{ c.title }}</div>
            <div class="small muted">{{ c.value }} · {{ c.dimension }} · {{ c.node }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">这次诊断对你有帮助吗？</div>
        <div class="row">
          <span v-for="n in 5" :key="n" class="chip" :class="{ on: feedbackRating >= n }" @click="feedbackRating = n">★</span>
          <button class="btn btn-sm" @click="submitFeedback">提交反馈</button>
          <span v-if="feedbackDone" class="badge badge-green">已记录，将用于优化 Prompt 与知识库</span>
        </div>
      </div>
    </template>
    <div v-else class="empty">
      <div class="empty-icon">◎</div>
      {{ error || '尚未生成诊断报告' }}
      <div class="mt"><button class="btn btn-primary" @click="$router.push(`/diagnosis/${id}/assessment`)">返回测评</button></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(true)
const error = ref('')
const report = ref(null)
const stageName = ref('')
const feedbackRating = ref(5)
const feedbackDone = ref(false)

onMounted(async () => {
  try {
    report.value = await api.get(`/diagnoses/${id}/report`)
    const stages = await api.get('/stages')
    const s = stages.find((x) => x.code === report.value.stage)
    stageName.value = s ? s.name : ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function startDecompose() {
  const r = report.value
  const names = [...new Set(r.priorities.map((p) => p.value))]
  const params = new URLSearchParams()
  params.set('stage', r.stage)
  if (r.process_id) params.set('process_id', r.process_id)
  if (names.length) params.set('values', names.join(','))
  params.set('diagnose', id)
  router.push({ path: '/decompose', query: Object.fromEntries(params) })
}

async function submitFeedback() {
  try {
    await api.post('/feedbacks', {
      target_type: 'diagnosis',
      target_id: Number(id),
      rating: feedbackRating.value,
      comment: ''
    })
    feedbackDone.value = true
  } catch (e) {
    error.value = e.message
  }
}
</script>
