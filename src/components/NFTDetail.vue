<template>
  <div class="nft-detail">
    <div class="detail-header">
      <img :src="formatUrl(nft?.imageUrl)" :alt="nft?.name" class="detail-image" />
      <div class="detail-info">
        <h2>{{ nft?.name }}</h2>
        <div class="basic-info">
          <div class="info-item">
            <span class="label">Token ID</span>
            <span class="value">{{ nft?.tokenId }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.level') }}</span>
            <span class="value">Lv.{{ nft?.level }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.status') }}</span>
            <span class="value">{{ nft?.isListed === 0 ? t('components.nftDetail.unlisted') : t('components.nftDetail.listed') }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.careMethod') }}</span>
            <span class="value">{{ nft?.isFostered === 0 ? t('components.nftDetail.unknown') : nft?.isFostered === 1 ? t('components.nftDetail.fostered') : t('components.nftDetail.selfCare') }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.exp') }}</span>
            <span class="value">{{ nft?.exp }}/{{ nft?.requiredExp }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.gender') }}</span>
            <span class="value">{{ nft?.gender === 1 ? t('breed.male') : t('breed.female') }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.breedType') }}</span>
            <span class="value">{{ nft?.breedType }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.birthDate') }}</span>
            <span class="value">{{ formatDate(nft?.mintTime) }}</span>
          </div>
        </div>
        <div v-if="userInfo?.username == nft?.address" class="action-buttons">
          <van-button 
            v-if="nft?.isListed === 0"
            type="primary" 
            size="small" 
            class="action-btn"
            @click="listNFTHandler"
          >
            {{ t('components.nftDetail.list') }}
          </van-button>
          <van-button 
            v-else
            type="danger" 
            size="small" 
            class="action-btn"
            @click="unlistNFTHandler"
          >
            {{ t('components.nftDetail.unlist') }}
          </van-button>
          <van-button 
            v-if="nft?.exp >= nft?.requiredExp"
            type="primary" 
            size="small" 
            class="action-btn"
            @click="upgradeNFTHandler"
          >
            {{ t('components.nftDetail.upgrade') }}
          </van-button>
          <van-button 
            v-if="nft?.isFostered === 0 || nft?.isFostered === 1"
            type="primary" 
            size="small" 
            class="action-btn"
            @click="goToDelivery"
          >
            {{ t('components.nftDetail.deliveryButton') }}
          </van-button>
          <van-button 
            type="primary" 
            size="small" 
            class="action-btn"
            @click="goToBreedSelect"
          >
            {{ t('components.nftDetail.breed') }}
          </van-button>
        </div>
      </div>
    </div>
    <div class="daily-records">
      <h3>{{ t('components.nftDetail.dailyRecords') }}</h3>
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="t('components.nftDetail.noMore')"
        @load="getRecords"
      >
        <div class="record-list">
          <div v-for="(record, index) in records" :key="index" class="record-item">
            <div class="record-header">
              <div class="record-date">{{ record.date }}</div>
            </div>
            <div class="record-content">
              <p v-if="record.text" class="record-text">{{ record.text }}</p>
              <div v-if="record.images && record.images.length > 0" class="record-images">
                <img 
                  v-for="(img, imgIndex) in record.images.slice(0, 3)" 
                  :key="imgIndex" 
                  :src="img" 
                  :alt="t('components.nftDetail.recordImage')"
                  @click="previewImage(img, record.images)"
                />
                <div v-if="record.images.length > 3" class="more-images" @click="previewImage(record.images[3], record.images)">
                  +{{ record.images.length - 3 }}
                </div>
              </div>
              <div v-if="record.video && record.video.length > 0 && record.video[0]" class="record-video-preview" @click="previewVideo(record.video[0])">
                <video :src="record.video[0]" muted></video>
                <div class="play-icon">▶</div>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </div>

    <!-- 图片预览弹窗 -->
    <van-image-preview
      v-model:show="showImagePreview"
      :images="previewImages"
      :start-position="previewIndex"
      @close="showImagePreview = false"
    />

    <!-- 视频预览弹窗 -->
    <van-popup v-model:show="showVideoPreview" position="center" round>
      <div class="video-preview">
        <video ref="videoPlayer" :src="previewVideoUrl" controls autoplay></video>
        <van-icon name="cross" class="close-icon" @click="closeVideoPreview" />
      </div>
    </van-popup>

    <!-- NFT上架弹窗 -->
    <ListNFTPopup
      v-model:show="showListPopup"
      :nft="nft"
      @success="() => nft.isListed = 1"
    />

    <!-- 快递信息弹窗 -->
    <DeliveryPopup
      v-model:show="showDeliveryPopup"
      @success="handleDeliverySuccess"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { unlistNft, upgradeNft, deliverPet, getShippingFee, getBalanceEth, upFee } from '@/services/wallet'
import ListNFTPopup from '@/components/ListNFTPopup.vue'
import DeliveryPopup from '@/components/DeliveryPopup.vue'
import {formatDate, formatUrl} from '@/utils/util'
import { useLoadingStore } from '@/store/loadingStore'
import {store} from '@/store/appkitStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loadingStore = useLoadingStore()

const props = defineProps({
  nft: {
    type: Object,
    default: () => null
  },
  refresh: {
    type: Function,
    default: () => {}
  }
})

const showRecordDetailPopup = ref(false)
const selectedRecord = ref(null)
const showImagePreview = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)
const showVideoPreview = ref(false)
const previewVideoUrl = ref('')
const videoPlayer = ref(null)
const userInfo = ref(null)

const records = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)

const router = useRouter()

const showListPopup = ref(false)
const showDeliveryPopup = ref(false)

const getRecords = async () => {
  try {
    const res = await request.get('/diary/list', {
      params: {
        tokenId: props.nft?.tokenId,
        pageSize: pageSize.value,
        pageNum: pageNum.value
      }
    })
    
    if (res.code === 401) {
      console.error('Please log in first.')
    } else {
      // 处理数据
      const processedRows = (res.rows || []).map(record => {
        return {
          ...record,
          images: record.imageUrl ? record.imageUrl.split(',') : [],
          video: record.videoUrl ? [record.videoUrl] : [],
          text: record.textUrl ? 'Loading...' : record.text || '',
          date: formatDate(record.createTime)
        }
      })

      if (pageNum.value === 1) {
        records.value = processedRows
      } else {
        records.value = [...records.value, ...processedRows]
      }
      
      // 判断是否加载完成
      if (!res.rows || res.rows.length < pageSize.value) {
        finished.value = true
      } else {
        pageNum.value++
      }

      // 加载文本内容
      processedRows.forEach(async (record) => {
        if (record.textUrl) {
          try {
            const textRes = await fetch(formatUrl(record.textUrl))
            const text = await textRes.text()
            const index = records.value.findIndex(r => r.id === record.id)
            if (index !== -1) {
              records.value[index].text = text
            }
          } catch (error) {
            console.error('Load text failed:', error)
          }
        }
      })
    }
  } catch (error) {
    // console.error('Get records failed:', error)
    // showToast('Get records failed')
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 重置分页
const resetPagination = () => {
  pageNum.value = 1
  finished.value = false
  records.value = []
}

// 组件挂载时初始化数据
onMounted(async() => {
  if (props.nft) {
    // resetPagination()
  }
  const res = await request.get('getInfo')
  userInfo.value = res.data.user
})

// 监听 NFT 变化
watch(
  () => props.nft,
  (newNFT) => {
    if (newNFT) {
      // resetPagination()
      getRecords()
    }
  }
)

const showRecordDetail = (record) => {
  selectedRecord.value = record
  showRecordDetailPopup.value = true
}

const previewImage = (img, images) => {
  previewImages.value = images
  previewIndex.value = images.indexOf(img)
  showImagePreview.value = true
}

const previewVideo = (videoUrl) => {
  previewVideoUrl.value = formatUrl(videoUrl)
  showVideoPreview.value = true
}

const closeVideoPreview = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
  showVideoPreview.value = false
}

// 监听弹窗关闭
watch(showVideoPreview, (newVal) => {
  if (!newVal) {
    closeVideoPreview()
  }
})

const listNFTHandler = async () => {
  showListPopup.value = true
}

const unlistNFTHandler = async () => {
  try {
    loadingStore.showLoading()
    const hash = await unlistNft(props.nft.tokenId)
    if (hash) {
      showToast(t('components.nftDetail.unlistSuccess'))
      props.nft.isListed = 0
    }
  } catch (error) {
    console.error('Unlist NFT error:', error)
    showToast(t('components.nftDetail.operationFailed'))
  } finally {
    loadingStore.hideLoading()
  }
}

const upgradeNFTHandler = async () => {
  try {
    loadingStore.showLoading()
    const fee = await upFee()
    const ethBalance = await getBalanceEth(store.accountState.address)
    if(ethBalance < fee) return showToast(t('marketplace.insufficientBalance'))
    const hash = await upgradeNft(props.nft.tokenId, fee)
    if (hash) {
      showToast(t('components.nftDetail.upgradeSuccess'))
      props.nft.level += 1
      props.nft.exp = 0
      props.nft.requiredExp = props.nft.level * 100
    }
  } catch (error) {
    console.error('Upgrade NFT error:', error)
    showToast(t('components.nftDetail.operationFailed'))
  } finally {
    loadingStore.hideLoading()
  }
}

const handleDeliverySuccess = async (deliveryInfo) => {
  try {
    loadingStore.showLoading()
    // 这里可以处理快递信息的提交
    const fee = await getShippingFee(props.nft.breedType)
    const ethBalance = await getBalanceEth(store.accountState.address);
    if(ethBalance < fee) return showToast(t('components.list.insufficientBalance'))
    await deliverPet(props.nft.tokenId, JSON.stringify(deliveryInfo), fee)
    props.nft.isFostered = 2;
    setTimeout(() => {
        props.refresh()
    }, 3000)
    showToast('Delivery information submitted successfully')
  } catch (error) {
    console.error('Delivery information submission failed:', error)
    showToast('Delivery information submission failed')
  }finally{
    loadingStore.hideLoading()
  }
}

const goToDelivery = () => {
  if(props.nft.isFostered == 2) return showToast(t('components.list.selfCareNoDelivery'))
  if(props.nft.isListed == 1) return showToast(t('components.list.listedNoDelivery'))
  showDeliveryPopup.value = true
}

const goToBreedSelect = () => {
  if(props.nft.level < 100) return showToast(t('components.list.levelRequired'))
  router.push({
    path: '/breed-select',
    query: {
      currentTokenId: props.nft.tokenId,
      gender: props.nft.gender === 1 ? 0 : 1,
      breedType: props.nft.breedType
    }
  })
}
</script>

<style lang="scss" scoped>
.nft-detail {
  padding: 1.5rem;
  max-height: 80vh;
  overflow-y: auto;

  .detail-header {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;

    .detail-image {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      object-fit: cover;
    }

    .detail-info {
      flex: 1;

      h2 {
        margin: 0 0 1rem;
        color: var(--mt-text);
      }

      .basic-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .label {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
          }

          .value {
            color: var(--mt-text);
            font-weight: 500;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

        .action-btn {
          flex: 1;
          min-width: 80px;
          height: 36px;
          border-radius: 18px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #fff;

          &.van-button--primary {
            background: var(--mt-primary);
            border-color: var(--mt-primary);

            &:active {
              opacity: 0.9;
            }
          }

          &.van-button--danger {
            background: var(--mt-warning, #ff9500);
            border-color: var(--mt-warning, #ff9500);

            &:active {
              opacity: 0.9;
            }
          }
        }
      }
    }
  }

  .daily-records {
    h3 {
      margin: 0 0 1rem;
      color: var(--mt-text);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .record-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .record-item {
        background: var(--mt-bg-secondary);
        border-radius: 12px;
        padding: 1rem;
        cursor: pointer;

        .record-header {
          margin-bottom: 0.75rem;

          .record-date {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
          }
        }

        .record-content {
          .record-text {
            margin: 0 0 0.75rem;
            color: var(--mt-text);
            font-size: 0.95rem;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .record-images {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            margin-bottom: 0.75rem;

            img {
              width: 100%;
              height: 100%;
              object-fit: scale-down;
              background: var(--mt-bg);
              border-radius: 4px;
            }

            .more-images {
              background: rgba(0, 0, 0, 0.5);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
              border-radius: 4px;
            }
          }

          .record-video-preview {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 4px;
            overflow: hidden;
            background: var(--mt-bg);

            video {
              width: 100%;
              height: 100%;
              object-fit: scale-down;
            }

            .play-icon {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: rgba(0, 0, 0, 0.5);
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
            }
          }
        }
      }
    }
  }

  .record-detail {
    padding: 1.5rem;
    max-height: 80vh;
    overflow-y: auto;

    .record-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .date {
        color: var(--mt-text-secondary);
        font-size: 0.9rem;
      }
    }

    .record-detail-content {
      p {
        margin: 0 0 1rem;
        color: var(--mt-text);
      }

      .record-detail-images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
        margin-bottom: 1rem;

        img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 4px;
        }
      }

      .record-detail-video {
        video {
          width: 100%;
          border-radius: 4px;
        }
      }
    }
  }

  .video-preview {
    position: relative;
    width: 100vw;
    max-width: 800px;
    aspect-ratio: 16/9;
    background: black;

    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .close-icon {
      position: absolute;
      top: 10px;
      right: 10px;
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 1;
    }
  }
}
</style> 