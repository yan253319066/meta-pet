<template>
  <div class="empty-state">
    <van-empty
      :image="image"
      :description="description || t('components.empty.noData')"
      :image-size="imageSize"
    />
  </div>
</template>

<script setup>
import { Empty as VanEmpty } from 'vant'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
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
.empty-state {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style> 