<template>
  <div v-if="isLogin" class="auth-page">
    <router-view />
  </div>
  <div v-else class="layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">C2</div>
        <div>
          <div class="brand-title">文化落地引擎</div>
          <div class="brand-sub">Culture2Action</div>
        </div>
      </div>
      <template v-for="group in navGroups" :key="group.label">
        <div class="nav-group-label">{{ group.label }}</div>
        <div
          v-for="item in group.items"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="$router.push(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </div>
      </template>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-title">{{ $route.meta.title || '工作台' }}</div>
        <div class="topbar-user">
          <span class="small muted">{{ user?.company || '未填写企业' }}</span>
          <div class="avatar">{{ (user?.nickname || 'U').slice(0, 1) }}</div>
          <span>{{ user?.nickname || '用户' }}</span>
          <button class="btn btn-sm" @click="logout">退出</button>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { store } from './store'

const route = useRoute()
const router = useRouter()
const isLogin = computed(() => route.path === '/login')
const user = computed(() => store.user)

const navGroups = [
  {
    label: '文化诊断',
    items: [
      { name: '工作台', path: '/', icon: '◎' },
      { name: '发起诊断', path: '/diagnosis/start', icon: '✚' }
    ]
  },
  {
    label: '内容生产',
    items: [
      { name: '行为拆解', path: '/decompose', icon: '⊞' },
      { name: '培训课件', path: '/courses', icon: '▤' },
      { name: '行为清单', path: '/actions', icon: '☰' }
    ]
  },
  {
    label: '资源库',
    items: [
      { name: '价值观库', path: '/values', icon: '★' },
      { name: '流程库', path: '/processes', icon: '⇄' },
      { name: '行业/阶段对比', path: '/compare', icon: '◧' }
    ]
  },
  {
    label: '服务与账户',
    items: [
      { name: '专家审核', path: '/reviews', icon: '✓' },
      { name: '我的项目', path: '/projects', icon: '▣' },
      { name: '按次付费', path: '/payment', icon: '¥' },
      { name: '设置', path: '/settings', icon: '⚙' }
    ]
  }
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/') || route.path.startsWith(path)
}

function logout() {
  store.logout()
  router.push('/login')
}
</script>
