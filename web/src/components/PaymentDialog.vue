<template>
  <div class="modal-mask" @click.self="$emit('cancel')">
    <div class="modal" style="max-width: 440px">
      <div class="card-title">按次付费</div>
      <div v-if="loading" class="loading"><div class="spinner"></div>创建订单…</div>
      <template v-else-if="order">
        <div class="alert" :class="order.free ? 'alert-success' : 'alert-info'">
          {{ order.free ? '首次使用免费，已自动开通' : '本次服务需按次付费' }}
        </div>
        <div class="between" style="font-size:15px">
          <span>{{ order.service.name }}</span>
          <span class="price-amount" style="font-size:22px">¥{{ order.amount }}</span>
        </div>
        <p class="small muted">{{ order.service.desc }}</p>
        <div v-if="!order.free">
          <div class="field">
            <label class="label">支付方式</label>
            <div class="chips">
              <div v-for="m in methods" :key="m" class="chip" :class="{ on: method === m }" @click="method = m">{{ m }}</div>
            </div>
          </div>
        </div>
        <div class="row mt">
          <button class="btn btn-primary btn-block" :disabled="paying" @click="pay">
            {{ order.free ? '开始使用' : paying ? '支付中…' : `确认支付 ¥${order.amount}` }}
          </button>
        </div>
        <div class="row mt"><button class="btn btn-ghost btn-block" @click="$emit('cancel')">取消</button></div>
      </template>
      <div v-else class="alert alert-danger">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const props = defineProps({ service: { type: String, required: true }, targetId: { type: [Number, String], default: null } })
const emit = defineEmits(['paid', 'cancel'])
const order = ref(null)
const loading = ref(true)
const paying = ref(false)
const error = ref('')
const method = ref('微信支付')
const methods = ['微信支付', '支付宝', '对公转账']

onMounted(async () => {
  try {
    order.value = await api.post('/orders', { service_type: props.service, target_id: props.targetId })
    if (order.value.status === 'paid') {
      emit('paid', order.value)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function pay() {
  paying.value = true
  try {
    await api.post(`/orders/${order.value.id}/pay`, { method: method.value })
    emit('paid', order.value)
  } catch (e) {
    error.value = e.message
  } finally {
    paying.value = false
  }
}
</script>
