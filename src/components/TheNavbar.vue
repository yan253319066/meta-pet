<template>
  <div class="navbar" :class="{ 'mobile': isMobile }">
    <div class="navbar-content">
      <div class="logo-container">
        <div class="logo">
          <img src="/images/logo.png" :alt="t('nav.logo')" />
          <span>MetaPet</span>
        </div>
        <div class="mobile-actions" v-if="isMobile">
          <van-button
            class="theme-btn mobile-theme-btn"
            :class="{ 'active': isThemeBtnActive }"
            :loading="loading"
            @touchstart="isThemeBtnActive = true"
            @touchend="handleThemeToggle"
            @touchcancel="isThemeBtnActive = false"
          >
            <img :src="theme === 'dark' ? '/images/light-theme.svg' : '/images/dark-theme.svg'" :alt="t('nav.theme')" class="theme-icon" />
          </van-button>
          <van-button
            class="lang-btn mobile-lang-btn"
            @click="toggleLanguage"
          >
            {{ currentLocale === 'en' ? 'EN' : '繁' }}
          </van-button>
          <div><appkit-button :loading="loading" /></div>
        </div>
      </div>
      
      <template v-if="!isMobile">
        <div class="nav-links">
          <router-link to="/" class="nav-item">{{ t('nav.home') }}</router-link>
          <router-link to="/marketplace" class="nav-item">{{ t('nav.marketplace') }}</router-link>
          <router-link to="/pets" class="nav-item">3D Pets</router-link> 
          <router-link to="/profile" class="nav-item">{{ t('nav.profile') }}</router-link>
        </div>

        <div class="right-section">
          <van-button
            class="theme-btn"
            :loading="loading"
            @click="handleThemeToggle"
          >
            <img :src="theme === 'dark' ? '/images/light-theme.svg' : '/images/dark-theme.svg'" :alt="t('nav.theme')" class="theme-icon" />
          </van-button>
          <van-button
            class="lang-btn"
            @click="toggleLanguage"
          >
            {{ currentLocale === 'en' ? 'EN' : '繁' }}
          </van-button>
          <!-- <a href="#" class="social-icon"><van-icon name="chat" /></a>
          <a href="#" class="social-icon"><van-icon name="chat" /></a>
          <a href="#" class="social-icon"><van-icon name="friends" /></a> -->
          <div><appkit-button :loading="loading" /></div>
        </div>
      </template>
    </div>

    <van-tabbar v-if="isMobile" v-model="activeTab" class="mobile-nav" fixed>
      <van-tabbar-item name="home" icon="home-o" to="/">{{ t('nav.home') }}</van-tabbar-item>
      <van-tabbar-item name="marketplace" icon="shop-o" to="/marketplace">{{ t('nav.marketplace') }}</van-tabbar-item>
      <van-tabbar-item name="pets" icon="like-o" to="/pets">3D Pets</van-tabbar-item> <!-- Added for mobile -->
      <van-tabbar-item name="profile" icon="user-o" to="/profile">{{ t('nav.profile') }}</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, onUpdated } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useI18n } from 'vue-i18n'
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import zhTW from 'vant/es/locale/lang/zh-TW'

import { initializeModal } from '@/config/appKit'
import { initializeSubscribers } from '@/utils/suscribers'

const appKit = initializeModal();

// Initialize subscribers
initializeSubscribers(appKit)

const { theme, toggleTheme } = useTheme()
const isMobile = ref(false)
const activeTab = ref('home')
const isThemeBtnActive = ref(false)
// const isConnectBtnActive = ref(false)
const { t, locale } = useI18n()
const currentLocale = ref(locale.value)
const loading = ref(false)

// 使用防抖优化响应式切换
let resizeTimer = null
const checkMobile = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    isMobile.value = window.innerWidth <= 768
  }, 100)
}

// 生命周期钩子
onMounted(() => {

  appKit.setThemeMode(theme.value)
  checkMobile()
  window.addEventListener('resize', checkMobile)

})

onUnmounted(() => {
  if (resizeTimer) clearTimeout(resizeTimer)
  window.removeEventListener('resize', checkMobile)

  
})

onUpdated(() => {
  // Update events

})

const handleThemeToggle = () => {
  loading.value = true
  try {
    isThemeBtnActive.value = false
    appKit.setThemeMode(theme.value === 'dark' ? 'light' : 'dark')
    toggleTheme()
  } finally {
    loading.value = false
  }
}

const toggleLanguage = () => {
  const newLocale = currentLocale.value === 'en' ? 'zh-TW' : 'en'
  currentLocale.value = newLocale
  locale.value = newLocale
  // 同时更新 Vant 组件的语言
  Locale.use(newLocale === 'en' ? 'en-US' : 'zh-TW', newLocale === 'en' ? enUS : zhTW)
}

</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--mt-bg);
  border-bottom: 1px solid var(--mt-border);
  transition: all 0.3s ease;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .navbar-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      
      img {
        height: 80px;
        width: auto;
      }
      
      span {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--mt-primary);
        display: inline;
      }
    }

    .mobile-actions {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-left: auto;

      .mobile-theme-btn {
        width: 32px !important;
        height: 32px !important;
        padding: 0 !important;
        border: 1.5px solid var(--mt-border) !important;
        border-radius: 50% !important;
        background: transparent !important;
        color: var(--mt-text) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
        backdrop-filter: blur(8px);
        
        .theme-icon {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        &:hover .theme-icon {
          transform: rotate(360deg);
        }

        &.active {
          transform: scale(0.95) rotate(-15deg);
          opacity: 0.8;
          transition: all 0.1s ease;
          background: color-mix(in srgb, var(--mt-primary) 12%, transparent) !important;

          .theme-icon {
            transform: rotate(-180deg);
          }
        }
      }

      .mobile-lang-btn {
        width: 32px !important;
        height: 32px !important;
        padding: 0 !important;
        border: 1.5px solid var(--mt-border) !important;
        border-radius: 50% !important;
        background: transparent !important;
        color: var(--mt-text) !important;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-tap-highlight-color: transparent;
        
        &:active {
          transform: scale(0.95);
          opacity: 0.8;
          transition: all 0.1s ease;
          background: color-mix(in srgb, var(--mt-primary) 12%, transparent) !important;
        }
      }

      .mobile-connect-btn {
        height: 32px !important;
        padding: 0 1rem !important;
        font-size: 0.85rem;
        user-select: none;
        -webkit-user-select: none;
        background: linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%) !important;
        color: var(--mt-bg) !important;
        border: none !important;
        
        &.active {
          transform: scale(0.95);
          opacity: 0.8;
          transition: all 0.1s ease;
          background: linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%) !important;
        }
      }
    }
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);

    .nav-item {
      color: var(--mt-text);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
      
      &:hover, &.router-link-active {
        color: var(--mt-primary);
      }
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;

    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--mt-hover-bg);
      }

      :deep(.van-icon) {
        font-size: 20px;
        color: var(--mt-text-secondary);
        transition: all 0.3s ease;
      }

      &:hover :deep(.van-icon) {
        color: var(--mt-primary);
        transform: translateY(-2px);
      }
    }

    .theme-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px !important;
      height: 36px !important;
      padding: 0 !important;
      border: 1.5px solid var(--mt-border) !important;
      border-radius: 50% !important;
      background: transparent !important;
      color: var(--mt-text) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      backdrop-filter: blur(8px);
      
      .theme-icon {
        width: 20px;
        height: 20px;
        transition: transform 0.3s ease;
      }

      &:hover {
        color: var(--mt-primary) !important;
        border-color: var(--mt-primary) !important;
        background: var(--mt-primary-light) !important;

        .theme-icon {
          transform: rotate(360deg);
        }
      }
    }

    .lang-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px !important;
      height: 36px !important;
      padding: 0 !important;
      border: 1.5px solid var(--mt-border) !important;
      border-radius: 50% !important;
      background: transparent !important;
      color: var(--mt-text) !important;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      backdrop-filter: blur(8px);

      &:hover {
        color: var(--mt-primary) !important;
        border-color: var(--mt-primary) !important;
        background: var(--mt-primary-light) !important;
      }
    }

    .connect-btn {
      height: 36px !important;
      padding: 0 1.5rem !important;
      border-radius: 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px;
      border: none !important;
      background: linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease !important;
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      color: var(--mt-bg) !important;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        background: linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%) !important;
      }
    }
  }
}

// 移动端适配
@media (max-width: 767px) {
  .navbar {
    padding: 0 12px;
    height: 56px;

    .logo-container {
      .logo {
        img {
          height: 28px;
        }

        span {
          font-size: 1rem;
        }
      }

      .mobile-actions {
        margin-left: auto;
      }
    }

    .nav-links, .right-section {
      display: none;
    }
  }
}

.mobile-nav {
  background: var(--mt-bg);
  border-top: 1px solid var(--mt-border);

  :deep(.van-tabbar) {
    background-color: var(--mt-bg);
  }

  :deep(.van-tabbar-item) {
    color: var(--mt-text-secondary);
    background-color: var(--mt-bg);
  }

  :deep(.van-tabbar-item--active) {
    color: var(--mt-primary);
  }

  :deep(.van-tabbar-item .van-icon) {
    color: inherit;
  }
}

// 移动端触摸反馈
@media (hover: none) {
  .theme-btn, .connect-btn {
    &:active {
      transition: all 0.1s ease !important;
      opacity: 0.8;
      transform: scale(0.98);
    }
  }
}

// 桌面端悬停效果
@media (hover: hover) {
  .theme-btn {
    &:hover {
      color: var(--mt-primary) !important;
      border-color: var(--mt-primary) !important;
      background: var(--mt-primary-light) !important;
    }
  }

  .connect-btn {
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%) !important;
    }
  }
}
</style> 