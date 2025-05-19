<template>
  <div class="breed-select">
    <div class="header">
      <van-nav-bar
        :title="t('breed.title')"
        left-arrow
        @click-left="router.back()"
      >
        <template #left>
          <van-icon name="arrow-left" color="var(--mt-text)" />
        </template>
      </van-nav-bar>
      <van-tabs v-model:active="activeTab" @change="handleTabChange" animated class="profile-tabs">
        <van-tab :title="t('breed.male')" />
        <van-tab :title="t('breed.female')" />
      </van-tabs>
    </div>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      :finished-text="t('breed.noMore')"
      @load="onLoad"
    >
      <div class="nft-grid">
        <div 
          v-for="(nft, index) in nftList" 
          :key="index" 
          class="nft-card"
          :class="{ 'selected': selectedNFT?.tokenId === nft.tokenId }"
          @click="handleSelect(nft)"
        >
          <div class="nft-image-container">
            <img :src="formatUrl(nft.imageUrl)" :alt="nft.name" class="nft-image" />
            <div class="nft-overlay">
              <div class="nft-name">{{ nft.name }}</div>
              <div class="nft-level">{{ t('profile.level') }}.{{ nft.level }}</div>
            </div>
          </div>
        </div>
      </div>
    </van-list>

    <div class="action-bar" v-if="selectedNFT">
      <van-button 
        block 
        type="primary" 
        :disabled="!canSelect"
        @click="confirmSelect"
      >
        {{ t('breed.confirmBreed') }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import {breedNft,breedFee, getBalanceEth} from '@/services/wallet'
import { useI18n } from 'vue-i18n'
import { store } from '@/store/appkitStore'
import { useLoadingStore } from '@/store/loadingStore'
import {formatUrl} from '@/utils/util'

const loadingStore = useLoadingStore();

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const nftList = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const activeTab = ref(Number(route.query.gender == 0 ? 1 : 0))
const selectedNFT = ref(null)

// 监听路由变化，更新 tab
watch(() => route.query.gender, (newGender) => {
  if (newGender !== undefined) {
    activeTab.value = Number(newGender)
    resetPagination()
    loadNFTs()
  }
})

// 处理 tab 切换
const handleTabChange = (index) => {
  resetPagination()
  loadNFTs()
}

// 计算是否可以选中
const canSelect = computed(() => {
  return selectedNFT.value && 
    selectedNFT.value.level >= 100 &&
    selectedNFT.value.gender === activeTab.value
})

// 处理列表加载
const onLoad = () => {
  if (loading.value) return
  loadNFTs()
}

// 加载 NFT 列表
const loadNFTs = async () => {
  loading.value = true
  try {
    const res = await request.get('/nft/breedList', {
      params: {
        pageSize: pageSize.value,
        pageNum: pageNum.value,
        gender: activeTab.value,
        level: 100,
        breedType: route.query.breedType
      }
    })
    
    if (res.code === 401) {
      console.error("Please login")
    } else {
      // 过滤掉当前 NFT
      const filteredNFTs = res.rows.filter(nft => nft.tokenId !== route.query.currentTokenId)
      
      if (pageNum.value === 1) {
        nftList.value = filteredNFTs
      } else {
        nftList.value = [...nftList.value, ...filteredNFTs]
      }
      
      // 判断是否加载完成
      if (res.rows.length < pageSize.value) {
        finished.value = true
      } else {
        pageNum.value++
      }
    }
  } catch (error) {
    console.error('Get NFT list failed:', error)
    showToast(t('breed.getNFTListFailed'))
  } finally {
    loading.value = false
  }
}

// 处理选择
const handleSelect = (nft) => {
  if (nft.level < 100) {
    showToast(t('breed.levelRequired'))
    return
  }
  if (nft.gender !== activeTab.value) {
    showToast(t('breed.selectGender', { gender: activeTab.value === 0 ? t('breed.male') : t('breed.female') }))
    return
  }
  selectedNFT.value = nft
}

// 确认选择
const confirmSelect = async () => { 
  try {
    if (!canSelect.value) {
      showToast(t('breed.notMeetCondition'))
      return
    }
    loadingStore.showLoading()
    const {data} = await request.get('pet/meta');
    const fee = await breedFee()
    const ethBalance = await getBalanceEth(store.accountState.address)
    if(ethBalance < fee) return showToast(t('marketplace.insufficientBalance'))
    const hash = breedNft(route.query.currentTokenId, selectedNFT.value.tokenId, data.metaUri, fee)
    showToast(t('breed.breedSuccess'))
    router.back()
  } catch (error) {
    console.error(t('breed.failed'), error)
    showToast(t('breed.failed'))
  }finally{
    loadingStore.hideLoading()
  }
}

// 重置分页
const resetPagination = () => {
  pageNum.value = 1
  finished.value = false
  nftList.value = []
  loading.value = false
}

// 组件挂载时加载数据
onMounted(() => {
  loadNFTs()
})
</script>

<style lang="scss" scoped>
.breed-select {
  min-height: 100vh;
  background: var(--mt-bg);
  color: var(--mt-text);

  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--mt-bg);

    .profile-tabs {
      padding: 0 1rem;

      :deep(.van-tabs__nav) {
        background: transparent;
      }

      :deep(.van-tab) {
        color: var(--mt-text-secondary);
      }

      :deep(.van-tab--active) {
        color: var(--mt-primary);
      }

      :deep(.van-tabs__line) {
        background-color: var(--mt-primary);
      }
    }

    :deep(.van-nav-bar) {
      background: var(--mt-bg);
      color: var(--mt-text);

      .van-nav-bar__title {
        color: var(--mt-text);
        font-size: 1.1rem;
        font-weight: 500;
      }
    }
  }

  .nft-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    padding: 1rem;

    .nft-card {
      background: var(--mt-bg-secondary);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s ease;
      border: 2px solid transparent;

      &.selected {
        border-color: var(--mt-primary);
      }

      &:hover {
        transform: translateY(-2px);
      }

      .nft-image-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        background: transparent;

        .nft-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .nft-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1rem;
          background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%);
          color: white;
          display: flex;
          flex-direction: column;

          .nft-name {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .nft-level {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: var(--mt-primary);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: 500;
          }

          .nft-gender {
            position: absolute;
            top: 1rem;
            left: 1rem;
            background: var(--mt-warning);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: 500;
          }
        }
      }

      .nft-info {
        padding: 1rem;

        .requirements {
          .requirement {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: var(--mt-bg);
            border-radius: 8px;
            margin-bottom: 0.5rem;

            &.satisfied {
              .van-icon {
                color: var(--mt-success);
              }
            }

            .van-icon {
              color: var(--mt-warning);
            }

            span {
              color: var(--mt-text);
              font-size: 0.9rem;
            }
          }
        }
      }
    }
  }

  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: var(--mt-bg);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

    .van-button {
      background: var(--mt-primary);
      border-color: var(--mt-primary);

      &:disabled {
        opacity: 0.5;
      }
    }
  }
}
</style> 