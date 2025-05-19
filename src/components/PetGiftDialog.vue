<template>
  <van-dialog
    v-model:show="showDialog"
    :showConfirmButton="false"
    class="pet-gift-dialog"
    :closeOnClickOverlay="closeOnClickOverlay"
    transition="dialog-bounce"
  >
    <div class="dialog-content" :class="{ 'show': showDialog }">
      <div class="gift-box" :class="{ 'open': isBoxOpened }">
        <img 
          v-if="!isBoxOpened" 
          src="/images/gift-box-closed.gif" 
          alt="Closed Gift Box" 
          class="gift-box-image"
        />
        <div v-else class="opened-box">
          <img src="/images/gift-box-open.gif" alt="Open Gift Box" class="gift-box-image" />
          <div class="pet-container">
            <img :src="formatUrl(currentPet.imageUri)" alt="Pet" class="pet-image" />
            <div class="sparkles">
              <span v-for="n in 12" :key="n" class="sparkle"></span>
            </div>
          </div>
        </div>
      </div>
      <h2 class="title" :class="{ 'show': isBoxOpened }">
        <!-- {{ $t('gift.title') }} -->
      </h2>
      <p class="description" :class="{ 'show': isBoxOpened }">
        {{ $t('gift.description') }}
      </p>
      <van-button
        v-if="!isBoxOpened"
        type="primary"
        class="open-button"
        @click="openBox"
      >
        {{ $t('gift.openBox') }}
      </van-button>
      <van-button
        v-else
        type="primary"
        class="claim-button"
        @click="claimPet"
      >
        {{ $t('gift.claim') }}
      </van-button>
    </div>
  </van-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import request from '@/utils/request'
import { adoptPet, zeroAddress, nftBalanceOf } from '@/services/wallet'
import { useTheme } from '../composables/useTheme'
import { useLoadingStore } from '@/store/loadingStore'
import { useI18n } from 'vue-i18n'
import {formatUrl} from '@/utils/util'
import { store } from '@/store/appkitStore'

const { t } = useI18n()
const loadingStore = useLoadingStore()

const { theme } = useTheme()

const closeOnClickOverlay = ref(true)
const showDialog = ref(false)
const isBoxOpened = ref(false)
const currentPet = ref(null)

const showError = (message) => {
  showToast({
    message: message,
    duration: 3000,
    position: 'middle',
    theme: theme.value
  })
}

const openBox = async() => { 
  try {
    loadingStore.showLoading()
    const res = await request.get('pet/meta')
    if(res.code == 401){
      showDialog.value = false
      appKit.open();
    }else{
      currentPet.value = res.data
      isBoxOpened.value = true
    }
  } catch (error) {
    console.error(t('gift.openBoxFailed'), error)
    showError(t('gift.openBoxFailed'))
  } finally {
    loadingStore.hideLoading()
  }
}

const claimPet = async() => {
  closeOnClickOverlay.value = false;
  try {
    loadingStore.showLoading()
    const inviteCode = localStorage.getItem("parentInviteCode")
    let parent = zeroAddress;
    if(inviteCode){
      const res = await request.get('pet/getParentUsername', {params:{parentInviteCode:inviteCode}})
      if(res?.data?.username)
        parent = res?.data?.username;
    }
    const hash = await adoptPet(currentPet.value.metaUri, currentPet.value.name, currentPet.value.breedType, parent)

    showDialog.value = false
    showToast({
      message: t('gift.claimSuccess'),
      duration: 3000,
      position: 'middle',
      theme: theme.value
    })
  } catch (error) {
    console.error(t('gift.claimFailed'), error)
    showError(t('gift.claimFailed'))
  } finally {
    loadingStore.hideLoading()
    closeOnClickOverlay.value = true;
  }
}

const checkClaimed = async() => {
  try {
    const {data} = await request.get('nft/checkGift')
    if (data) {
      showDialog.value = false
    } else {
      showDialog.value = true
    }
  } catch (error) {
    showDialog.value = false
    // console.error(t('gift.checkFailed'), error)
    // showError(t('gift.checkFailed'))
  } finally {

  }
}

onMounted(() => {
  if(localStorage.getItem("meta-token")){
    checkClaimed()
  }
  // 监听登录成功事件
  window.addEventListener('login-success', () => {
    checkClaimed()
  })
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('login-success', checkClaimed)
})
</script>

<style lang="scss" scoped>
@use "sass:math";

// 弹窗动画
:deep(.dialog-bounce-enter-active) {
  animation: dialog-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.dialog-bounce-leave-active) {
  animation: dialog-bounce-out 0.3s cubic-bezier(0.34, 0.64, 1, 1);
}

@keyframes dialog-bounce-in {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes dialog-bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.3);
    opacity: 0;
  }
}

.pet-gift-dialog {
  :deep(.van-dialog) {
    background: var(--mt-bg);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid var(--mt-border);
  }
}

.dialog-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
  background: radial-gradient(circle at center, 
    color-mix(in srgb, var(--mt-primary) 30%, transparent) 0%, 
    color-mix(in srgb, var(--mt-primary) 10%, transparent) 50%,
    transparent 100%
  );
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: 0.2s;

  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.gift-box {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));

  .gift-box-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .opened-box {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.pet-container {
  position: absolute;
  width: 120px;
  height: 120px;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: 0.8s;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));

  .open & {
    opacity: 1;
    transform: translateY(0);
  }
}

.pet-image {
  width: 120px;
  height: 120px;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.sparkles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  .sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--mt-primary);
    border-radius: 50%;
    opacity: 0;
    filter: drop-shadow(0 0 4px var(--mt-primary));

    @for $i from 1 through 12 {
      &:nth-child(#{$i}) {
        top: calc(math.random() * 100%);
        left: calc(math.random() * 100%);
        animation: sparkle 1.5s ease-in-out infinite;
        animation-delay: $i * 0.1s;
      }
    }
  }
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0.5rem 0;
  color: var(--mt-text);
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: 1s;
  pointer-events: none;

  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.description {
  text-align: center;
  color: var(--mt-text-secondary);
  margin-bottom: 1rem;
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: 1.2s;
  pointer-events: none;
  width: 80%;

  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.open-button,
.claim-button {
  position: relative;
  z-index: 1;
  height: 40px !important;
  padding: 0 2rem !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  border: none !important;
  background: linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease !important;
  margin-top: 2rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    background: linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%) !important;
  }

  &:active {
    transform: scale(0.95);
    transition: all 0.1s ease;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .dialog-content {
    padding: 1.5rem;
    min-height: 320px;
  }

  :deep(.van-dialog) {
    width: 90% !important;
    max-width: 320px;
  }

  .gift-box {
    width: 140px;
    height: 140px;
    margin-bottom: 0.75rem;
  }

  .pet-image {
    width: 100px;
    height: 100px;
  }

  .title {
    font-size: 1.2rem;
    top: 25%;
  }

  .description {
    font-size: 0.9rem;
    top: 50%;
    width: 90%;
  }

  .open-button,
  .claim-button {
    margin-top: 1.5rem;
  }
}

// 优化遮罩层动画
:deep(.van-overlay) {
  backdrop-filter: blur(4px);
  transition: all 0.3s ease-out;
}

:deep(.van-overlay-enter-active),
:deep(.van-overlay-leave-active) {
  backdrop-filter: blur(0);
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--mt-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-text {
  color: var(--mt-text);
  font-size: 1rem;
  font-weight: 500;
}

:deep(.van-toast) {
  background-color: var(--mt-bg) !important;
  color: var(--mt-text) !important;
  border: 1px solid var(--mt-border) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

:deep(.van-toast--text) {
  padding: 12px 24px !important;
  font-size: 16px !important;
  line-height: 1.5 !important;
}
</style> 