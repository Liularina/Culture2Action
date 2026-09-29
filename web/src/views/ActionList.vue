<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card">
      <div class="card-title">行为清单</div>
      <div class="card-sub">按价值观、流程节点、岗位、企业阶段查看可观察的具体行为，用于日常观察、绩效评估与培训</div>
      <div class="grid grid-4">
        <div class="field">
          <label class="label">流程</label>
          <select v-model.number="filters.process_id" @change="load">
            <option :value="0">全部</option>
            <option v-for="p in processes" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">价值观</label>
          <select v-model.number="filters.value_id" @change="load">
            <option :value="0">全部</option>
            <option v-for="v in values" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">流程节点</label>
          <select v-model.number="filters.node_id" @change="load">
            <option :value="0">全部</option>
            <option v-for="n in allNodes" :key="n.id" :value="n.id">{{ n.name }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">企业阶段</label>
          <select v-model="filters.stage" @change="load">
            <option value="">全部</option>
            <option v-for="s in stages" :key="s.code" :value="s.code">{{ s.code }} {{ s.name }}</option>
          </select>
        </div>
      </div>
      <div class="between mt">
        <span class="small muted">共 {{ rows.length }} 条行为</span>
        <div class="row">
          <button class="btn btn-sm" @click="exportCSV">导出 Excel(CSV)</button>
          <button class="btn btn-sm" @click="exportPDF">导出 PDF(打印)</button>
        </div>
      </div>
    </div>

    <div v-if="!rows.length" class="empty"><div class="empty-icon">☰</div>暂无行为记录，请先做行为拆解</div>

    <div v-else class="card">
      <table>
        <thead>
          <tr>
            <th>价值观</th>
            <th>子维度</th>
            <th>流程节点</th>
            <th>阶段</th>
            <th style="width:38%">具体行动</th>
            <th>评估标准</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id">
            <td>{{ r.value_name }}</td>
            <td>{{ r.dimension_name }}</td>
            <td>{{ r.node_name }}</td>
            <td><span class="badge">{{ r.stage }}</span></td>
            <td>{{ r.action }}</td>
            <td class="small muted">{{ r.assessment }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div id="print-area" style="display:none"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '../api'

const rows = ref([])
const values = ref([])
const processes = ref([])
const stages = ref([])
const allNodes = ref([])
const error = ref('')
const filters = reactive({ process_id: 0, value_id: 0, node_id: 0, stage: '' })

const query = computed(() => {
  const q = []
  if (filters.process_id) q.push(`process_id=${filters.process_id}`)
  if (filters.value_id) q.push(`value_id=${filters.value_id}`)
  if (filters.node_id) q.push(`node_id=${filters.node_id}`)
  if (filters.stage) q.push(`stage=${filters.stage}`)
  return q.length ? `?${q.join('&')}` : ''
})

async function load() {
  try {
    rows.value = await api.get(`/actions${query.value}`)
  } catch (e) {
    error.value = e.message
  }
}

onMounted(async () => {
  try {
    ;[values.value, processes.value, stages.value] = await Promise.all([
      api.get('/values'),
      api.get('/processes'),
      api.get('/stages')
    ])
    for (const p of processes.value) {
      const detail = await api.get(`/processes/${p.id}`)
      allNodes.value.push(...detail.nodes)
    }
    await load()
  } catch (e) {
    error.value = e.message
  }
})

function exportCSV() {
  const header = ['价值观', '子维度', '流程节点', '企业阶段', '具体行动', '评估标准', '案例']
  const lines = [header.join(',')]
  rows.value.forEach((r) => {
    lines.push(
      [r.value_name, r.dimension_name, r.node_name, r.stage, r.action, r.assessment, r.training_case]
        .map((x) => `"${String(x || '').replace(/"/g, '""')}"`)
        .join(',')
    )
  })
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'behavior-list.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF() {
  const win = window.open('', '_blank')
  const rowsHtml = rows.value
    .map(
      (r) =>
        `<tr><td>${r.value_name}</td><td>${r.dimension_name}</td><td>${r.node_name}</td><td>${r.stage}</td><td>${r.action}</td><td>${r.assessment}</td></tr>`
    )
    .join('')
  win.document.write(`
    <html><head><title>行为清单</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f0f0f0}</style>
    </head><body>
    <h2>行为清单</h2>
    <table><thead><tr><th>价值观</th><th>子维度</th><th>流程节点</th><th>阶段</th><th>具体行动</th><th>评估标准</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`)
  win.document.close()
}
</script>
