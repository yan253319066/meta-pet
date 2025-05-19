<template>
  <van-popup :show="show" @update:show="$emit('update:show', $event)" position="bottom" round>
    <div class="delivery-popup">
      <h3>{{ t('components.delivery.title') }}</h3>
      <div class="form">
        <van-field
          v-model="form.receiver"
          :label="t('components.delivery.receiver')"
          :placeholder="t('components.delivery.receiverPlaceholder')"
          :rules="[{ required: true, message: t('components.delivery.receiverRequired') }]"
        />
        <van-field
          v-model="form.phone"
          :label="t('components.delivery.phone')"
          :placeholder="t('components.delivery.phonePlaceholder')"
          :rules="[{ required: true, message: t('components.delivery.phoneRequired') }]"
        />
        <van-field
          v-model="form.address"
          :label="t('components.delivery.address')"
          :placeholder="t('components.delivery.addressPlaceholder')"
          :rules="[{ required: true, message: t('components.delivery.addressRequired') }]"
        />
        <div class="delivery-fee">
          <span class="label">{{ t('components.delivery.fee') }}</span>
          <span class="value">{{ deliveryFee }} ETH</span>
        </div>
      </div>
      <div class="history-section" v-if="deliveryHistory.length > 0">
        <h4>{{ t('components.delivery.history') }}</h4>
        <div class="history-list">
          <div 
            v-for="(item, index) in deliveryHistory" 
            :key="index" 
            class="history-item"
            @click="selectHistory(item)"
          >
            <div class="info">
              <div class="receiver">{{ item.receiver }}</div>
              <div class="phone">{{ item.phone }}</div>
              <div class="address">{{ item.address }}</div>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
      </div>
      <div class="action-buttons">
        <van-button block type="primary" @click="handleSubmit">{{ t('components.delivery.confirm') }}</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'success'])

// 快递费用计算
const deliveryFee = computed(() => {
  return '0.01' // 这里可以根据实际需求计算快递费用
})

// 表单数据
const form = ref({
  receiver: '',
  phone: '',
  address: ''
})

// 历史记录
const deliveryHistory = ref([])

// 从 localStorage 加载历史记录
const loadHistory = () => {
  const history = localStorage.getItem('deliveryHistory')
  if (history) {
    try {
      deliveryHistory.value = JSON.parse(history)
    } catch (error) {
      console.error(t('components.list.parseHistoryFailed'), error)
      deliveryHistory.value = []
    }
  }
}

// 保存历史记录到 localStorage
const saveHistory = () => {
  try {
    localStorage.setItem('deliveryHistory', JSON.stringify(deliveryHistory.value))
  } catch (error) {
    console.error(t('components.list.saveHistoryFailed'), error)
  }
}

// 选择历史记录
const selectHistory = (item) => {
  form.value = { ...item }
}

// 提交表单
const handleSubmit = () => {
  if (!form.value.receiver || !form.value.phone || !form.value.address) {
    showToast(t('components.delivery.fillComplete'))
    return
  }

  // 保存到历史记录
  const exists = deliveryHistory.value.some(
    item => item.phone === form.value.phone && item.address === form.value.address
  )
  if (!exists) {
    deliveryHistory.value.unshift({ ...form.value })
    saveHistory()
  }

  emit('success', {
    ...form.value,
    fee: deliveryFee.value
  })
  emit('update:show', false)
}

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistory()
})
</script>

<style lang="scss" scoped>
.delivery-popup {
  padding: 1.5rem;

  h3 {
    margin: 0 0 1.5rem;
    text-align: center;
    color: var(--mt-text);
  }

  .form {
    margin-bottom: 1.5rem;

    .delivery-fee {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: var(--mt-bg-secondary);
      border-radius: 8px;
      margin-top: 1rem;

      .label {
        color: var(--mt-text-secondary);
      }

      .value {
        color: var(--mt-primary);
        font-weight: 500;
      }
    }
  }

  .history-section {
    margin-bottom: 1.5rem;

    h4 {
      margin: 0 0 1rem;
      color: var(--mt-text);
      font-size: 1rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--mt-bg-secondary);
        border-radius: 8px;
        cursor: pointer;

        .info {
          flex: 1;

          .receiver {
            font-weight: 500;
            margin-bottom: 0.25rem;
          }

          .phone {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .address {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
          }
        }

        .van-icon {
          color: var(--mt-text-secondary);
        }
      }
    }
  }

  .action-buttons {
    .van-button {
      background: var(--mt-primary);
      border-color: var(--mt-primary);
    }
  }
}
</style> 