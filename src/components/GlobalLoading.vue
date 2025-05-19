<template>
  <van-overlay :show="show" class="global-loading">
    <div class="loading-content">
      <van-loading type="spinner" color="var(--mt-primary)" size="36px" />
      <span class="loading-text">{{ text || t('components.loading.loading') }}</span>
    </div>
  </van-overlay>
</template>

<script setup>
import { Empty as VanEmpty } from 'vant'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: 'search'
  },
  description: {
    type: String,
    default: ''
  },
  imageSize: {
    type: [String, Number],
    default: 120
  }
})
</script>

<style lang="scss" scoped>
.global-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999 !important;

  :deep(.van-overlay) {
    z-index: 9999 !important;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: var(--mt-bg);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.05);
    min-width: 160px;

    .loading-text {
      color: var(--mt-text);
      font-size: 0.95rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-text {
  color: #fff;
  font-size: 1rem;
  margin-top: 1rem;
}
</style> 