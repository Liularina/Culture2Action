import { createRouter, createWebHashHistory } from 'vue-router'
import { store } from './store'

const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { public: true, title: '登录' } },
  { path: '/', component: () => import('./views/Home.vue'), meta: { title: '工作台' } },
  { path: '/diagnosis/start', component: () => import('./views/DiagnosisStart.vue'), meta: { title: '发起企业诊断' } },
  { path: '/diagnosis/:id/self', component: () => import('./views/DiagnosisSelf.vue'), meta: { title: '企业现状自述' } },
  { path: '/diagnosis/:id/assessment', component: () => import('./views/DiagnosisAssessment.vue'), meta: { title: '行为测评' } },
  { path: '/diagnosis/:id/report', component: () => import('./views/DiagnosisReport.vue'), meta: { title: '诊断报告' } },
  { path: '/values', component: () => import('./views/ValueManage.vue'), meta: { title: '价值观库' } },
  { path: '/processes', component: () => import('./views/ProcessSelect.vue'), meta: { title: '流程库' } },
  { path: '/decompose', component: () => import('./views/Decompose.vue'), meta: { title: '行为拆解' } },
  { path: '/actions', component: () => import('./views/ActionList.vue'), meta: { title: '行为清单' } },
  { path: '/compare', component: () => import('./views/Compare.vue'), meta: { title: '行业/阶段对比' } },
  { path: '/courses', component: () => import('./views/CourseList.vue'), meta: { title: '培训课件' } },
  { path: '/courses/:id', component: () => import('./views/CourseEdit.vue'), meta: { title: '课件编辑' } },
  { path: '/reviews', component: () => import('./views/ReviewList.vue'), meta: { title: '专家审核' } },
  { path: '/reviews/submit', component: () => import('./views/ReviewSubmit.vue'), meta: { title: '提交专家审核' } },
  { path: '/reviews/:id', component: () => import('./views/ReviewResult.vue'), meta: { title: '审核结果' } },
  { path: '/payment', component: () => import('./views/Payment.vue'), meta: { title: '按次付费' } },
  { path: '/projects', component: () => import('./views/Projects.vue'), meta: { title: '我的项目' } },
  { path: '/projects/:id', component: () => import('./views/ProjectDetail.vue'), meta: { title: '项目详情' } },
  { path: '/settings', component: () => import('./views/Settings.vue'), meta: { title: '设置' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  if (!to.meta.public && !store.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && store.token) return { path: '/' }
  return true
})

export default router
