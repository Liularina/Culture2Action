<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="card">
      <div class="card-title">按次付费</div>
      <div class="card-sub">用一次付一次，降低决策门槛。首次注册送 1 次免费诊断，首次行为拆解免费体验。</div>
      <div class="grid grid-3">
        <div
          v-for="(p, key) in prices"
          :key="key"
          class="price-card"
          :class="{ on: selected === key }"
          @click="selected = key"
        >
          <div style="font-weight:600">{{ p.name }}</div>
          <div class="price-amount">¥<small>{{ p.amount }}</small></div>
          <div class="small muted">{{ p.desc }}</div>
        </div>
      </div>
      <div class="between mt">
        <span class="small muted">已选：{{ prices[selected]?.name }}</span>
        <button class="btn btn-primary btn-lg" :disabled="loading" @click="createOrder">
          {{ loading ? '创建订单…' : '创建订单' }}
        </button>
      </div>
    </div>

    <div v-if="currentOrder" class="card">
      <div class="card-title">订单支付</div>
      <div class="between">
        <span>{{ currentOrder.service.name }}</span>
        <span class="price-amount" style="font-size:22px">¥{{ currentOrder.amount }}</span>
      </div>
      <div v-if="currentOrder.status === 'paid'" class="alert alert-success mt">该订单已支付</div>
      <template v-else>
        <div class="field mt">
          <label class="label">支付方式</label>
          <div class="chips">
            <div v-for="m in methods" :key="m" class="chip" :class="{ on: method === m }" @click="method = m">{{ m }}</div>
          </div>
        </div>
        <button class="btn btn-primary" :disabled="paying" @click="pay">{{ paying ? '支付中…' : '确认支付' }}</button>
      </template>
    </div>

    <div class="card">
      <div class="card-title">订单记录</div>
      <div v-if="!orders.length" class="empty">暂无订单</div>
      <table v-else>
        <thead><tr><th>服务</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td>{{ prices[o.service_type]?.name || o.service_type }}</td>
            <td>¥{{ o.amount }}</td>
            <td><span class="badge" :class="o.status === 'paid' ? 'badge-green' : 'badge-orange'">{{ o.status === 'paid' ? '已支付' : '待支付' }}</span></td>
            <td class="small muted">{{ o.paid_at || o.created_at }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const prices = ref({})
const selected = ref('package')
const orders = ref([])
const currentOrder = ref(null)
const loading = ref(false)
const paying = ref(false)
const error = ref('')
const method = ref('微信支付')
const methods = ['微信支付', '支付宝', '对公转账']

async function loadOrders() {
  orders.value = await api.get('/orders')
}

onMounted(async () => {
  try {
    prices.value = await api.get('/prices')
    await loadOrders()
  } catch (e) {
    error.value = e.message
  }
})

async function createOrder() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.post('/orders', { service_type: selected.value })
    currentOrder.value = { ...data, service: prices.value[selected.value] }
    if (data.status === 'paid') {
      currentOrder.value.free = true
    }
    await loadOrders()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function pay() {
  paying.value = true
  try {
    await api.post(`/orders/${currentOrder.value.id}/pay`, { method: method.value })
    currentOrder.value.status = 'paid'
    await loadOrders()
  } catch (e) {
    error.value = e.message
  } finally {
    paying.value = false
  }
}
</script>
