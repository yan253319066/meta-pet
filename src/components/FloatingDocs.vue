<template>
  <div class="floating-docs" :class="{ 'is-open': isOpen }">
    <div class="floating-ball" @click="toggleMenu">
      <i class="fas fa-book"></i>
    </div>
    <div class="docs-menu" v-show="isOpen">
      <div class="menu-item" @click="openDoc('whitepaper-cn')">
        <i class="fas fa-file-pdf"></i>
        <span>{{ t('components.docs.whitepaper') }}</span>
      </div>
      <div class="menu-item" @click="openDoc('whitepaper-en')">
        <i class="fas fa-file-pdf"></i>
        <span>{{ t('components.docs.whitepaperEn') }}</span>
      </div>
      <div class="menu-item" @click="openDoc('guide-cn')">
        <i class="fas fa-book-open"></i>
        <span>{{ t('components.docs.guide') }}</span>
      </div>
      <div class="menu-item" @click="openDoc('guide-en')">
        <i class="fas fa-globe"></i>
        <span>{{ t('components.docs.guideEn') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isOpen = ref(false)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const openDoc = (type) => {
  const docs = {
    'whitepaper-cn': '/docs/whitepaper/metapet_whitepaper_cn_tw.pdf',
    'whitepaper-en': '/docs/whitepaper/metapet_whitepaper_en.pdf',
    'guide-cn': '/docs/user-guide-cn-tw.md',
    'guide-en': '/docs/user-guide-en.md'
  }
  
  window.open(docs[type], '_blank')
  isOpen.value = false
}
</script>

<style scoped>
.floating-docs {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}

@media (max-width: 768px) {
  .floating-docs {
    right: 16px;
    bottom: 80px; /* 调整位置，避免遮挡底部导航栏 */
  }
}

.floating-ball {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--mt-primary), var(--mt-primary-dark));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.floating-ball:hover {
  animation-play-state: paused;
  transform: scale(1.1);
}

.floating-ball i {
  color: white;
  font-size: 20px;
}

.docs-menu {
  position: absolute;
  bottom: 60px;
  right: 0;
  background: white;
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 150px;
}

.menu-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f3f4f6;
}

.menu-item i {
  color: #6366f1;
  width: 20px;
}

.menu-item span {
  color: #374151;
  font-size: 14px;
}

@media (max-width: 768px) {
  .floating-ball {
    width: 44px;
    height: 44px;
    animation: bounce 2s infinite;
  }
  
  .floating-ball i {
    font-size: 18px;
  }
}
</style> 