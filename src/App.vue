<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import TheNavbar from '@/components/TheNavbar.vue'
import { useTheme } from './composables/useTheme'
import { ConfigProvider } from 'vant'
import {updateContractStore} from '@/store/contract'
import request from './utils/request'
import { useLoadingStore } from '@/store/loadingStore'
import GlobalLoading from '@/components/GlobalLoading.vue'

const { theme } = useTheme()
const loadingStore = useLoadingStore()

onMounted(()=>{
  // request.get('pet/getContract').then((res)=>{
  //   updateContractStore(res.data)
  // })
  updateContractStore({
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    PetInfoManager: '0x10a94fFAFd46Ab8c1caB14d2b935faa9726aAF7c',
    PetNFT: '0xd61C602738a07988ae063b19a0f02735dad86dB4',
    PetMarket: '0x141328B9dc9D7d4445961F58a51fFF21F840AFd6',
    PetDiary: '0xA462B35B896F7856AdBb3159784B1315E9020c9B',
    PetBreeding: '0x7539dfD0cb640bA5fF909fc17deCDb43B37287AA'
})
})

</script>

<template>
  <van-config-provider :theme="theme">
    <div class="app">
      <TheNavbar />
      <main class="main-content">
        <router-view />
      </main>
      <GlobalLoading :show="loadingStore.loading.value" :text="loadingStore.loadingText.value" />
    </div>
  </van-config-provider>
</template>

<style>
/* .van-theme-dark body {
  color: #f5f5f5;
  background-color: black;
} */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background: var(--mt-bg);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  padding-top: 75px; /* 导航栏高度 */
  padding-bottom: 0px; /* 底部导航栏高度 */
  flex: 1;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 40px; /* 移动端导航栏高度 */
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
