<template>
  <div>
    <div v-if="loading" class="loading"><div class="spinner"></div>加载课件…</div>
    <template v-else-if="content">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="saved" class="alert alert-success">已保存</div>

      <div class="between mb">
        <div class="tabs" style="margin:0; border:0">
          <div class="tab" :class="{ on: tab === 'edit' }" @click="tab = 'edit'">编辑</div>
          <div class="tab" :class="{ on: tab === 'preview' }" @click="tab = 'preview'">预览</div>
        </div>
        <div class="row">
          <button class="btn btn-sm" @click="save">保存</button>
          <button class="btn btn-sm" @click="exportFile('word')">导出 Word</button>
          <button class="btn btn-sm" @click="exportFile('ppt')">导出 PPT</button>
          <button class="btn btn-sm btn-primary" @click="$router.push(`/reviews/submit?type=course&id=${id}`)">提交专家审核</button>
        </div>
      </div>

      <div v-if="tab === 'edit'">
        <div class="card">
          <div class="field">
            <label class="label">课程标题</label>
            <input v-model="content.title" />
          </div>
          <div class="field">
            <label class="label">学习目标（每行一条）</label>
            <textarea v-model="objectivesText" rows="3"></textarea>
          </div>
          <div class="field">
            <label class="label">价值观解读</label>
            <textarea v-model="content.value_interpretation" rows="2"></textarea>
          </div>
          <div class="field">
            <label class="label">流程节点说明</label>
            <textarea v-model="content.node_intro" rows="2"></textarea>
          </div>
          <div class="field">
            <label class="label">企业阶段适配说明</label>
            <textarea v-model="content.stage_note" rows="2"></textarea>
          </div>
        </div>

        <div class="card">
          <div class="card-title">具体行动清单</div>
          <div v-for="(a, i) in content.actions" :key="i" class="action-item">
            <div class="field">
              <label class="label">行动 {{ i + 1 }}</label>
              <textarea v-model="a.action" rows="2"></textarea>
            </div>
            <div class="field">
              <label class="label">评估标准</label>
              <input v-model="a.assessment" />
            </div>
            <div class="field" style="margin:0">
              <label class="label">案例</label>
              <input v-model="a.training_case" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="field">
            <label class="label">正面案例</label>
            <textarea v-model="content.positive_case" rows="2"></textarea>
          </div>
          <div class="field">
            <label class="label">反面案例</label>
            <textarea v-model="content.negative_case" rows="2"></textarea>
          </div>
          <div class="field">
            <label class="label">讨论题（每行一条）</label>
            <textarea v-model="discussionText" rows="3"></textarea>
          </div>
          <div class="card-title" style="font-size:14px">角色扮演脚本</div>
          <div class="field"><label class="label">名称</label><input v-model="content.roleplay.title" /></div>
          <div class="field"><label class="label">角色（每行一个）</label><textarea v-model="rolesText" rows="2"></textarea></div>
          <div class="field"><label class="label">场景</label><textarea v-model="content.roleplay.scene" rows="2"></textarea></div>
          <div class="field"><label class="label">目标</label><textarea v-model="content.roleplay.goal" rows="2"></textarea></div>
          <div class="card-title" style="font-size:14px">考核点（每行一条）</div>
          <textarea v-model="assessmentText" rows="3"></textarea>
        </div>
      </div>

      <div v-else class="card">
        <h2 style="text-align:center">{{ content.title }}</h2>
        <h3>一、学习目标</h3>
        <ul><li v-for="(o, i) in content.objectives" :key="i">{{ o }}</li></ul>
        <h3>二、价值观解读</h3><p class="pre-wrap">{{ content.value_interpretation }}</p>
        <h3>三、流程节点说明</h3><p class="pre-wrap">{{ content.node_intro }}</p>
        <h3>四、企业阶段适配说明</h3><p class="pre-wrap">{{ content.stage_note }}</p>
        <h3>五、具体行动清单</h3>
        <div v-for="(a, i) in content.actions" :key="i" class="action-item">
          <div class="action-text">{{ a.index }}. {{ a.action }}</div>
          <div class="small muted">评估标准：{{ a.assessment }}</div>
        </div>
        <h3>六、正面案例</h3><p class="pre-wrap">{{ content.positive_case }}</p>
        <h3>七、反面案例</h3><p class="pre-wrap">{{ content.negative_case }}</p>
        <h3>八、讨论题</h3>
        <ol><li v-for="(d, i) in content.discussion" :key="i">{{ d }}</li></ol>
        <h3>九、角色扮演脚本</h3>
        <p><strong>{{ content.roleplay.title }}</strong></p>
        <ul><li v-for="(r, i) in content.roleplay.roles" :key="i">{{ r }}</li></ul>
        <p>场景：{{ content.roleplay.scene }}</p>
        <p>目标：{{ content.roleplay.goal }}</p>
        <h3>十、考核点</h3>
        <ol><li v-for="(a, i) in content.assessment" :key="i">{{ a.point || a }}</li></ol>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const id = route.params.id
const loading = ref(true)
const error = ref('')
const saved = ref(false)
const tab = ref('edit')
const content = ref(null)

const joinLines = (arr) => (arr || []).join('\n')
const objectivesText = computed({
  get: () => joinLines(content.value?.objectives),
  set: (v) => (content.value.objectives = v.split('\n').map((s) => s.trim()).filter(Boolean))
})
const discussionText = computed({
  get: () => joinLines(content.value?.discussion),
  set: (v) => (content.value.discussion = v.split('\n').map((s) => s.trim()).filter(Boolean))
})
const rolesText = computed({
  get: () => joinLines(content.value?.roleplay?.roles),
  set: (v) => (content.value.roleplay.roles = v.split('\n').map((s) => s.trim()).filter(Boolean))
})
const assessmentText = computed({
  get: () => (content.value?.assessment || []).map((a) => a.point || a).join('\n'),
  set: (v) =>
    (content.value.assessment = v.split('\n').map((s) => s.trim()).filter(Boolean).map((point) => ({ point, standard: '' })))
})

onMounted(async () => {
  try {
    const data = await api.get(`/courses/${id}`)
    content.value = data.content
    if (!content.value.roleplay) content.value.roleplay = { title: '', roles: [], scene: '', goal: '' }
    if (!content.value.actions) content.value.actions = []
    if (!content.value.assessment) content.value.assessment = []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  try {
    await api.put(`/courses/${id}`, { content: content.value, title: content.value.title })
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (e) {
    error.value = e.message
  }
}

async function exportFile(format) {
  try {
    await api.download(`/courses/${id}/export?format=${format}`, `course-${id}.${format === 'ppt' ? 'pptx' : 'docx'}`)
  } catch (e) {
    error.value = e.message
  }
}
</script>
