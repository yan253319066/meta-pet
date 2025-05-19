<template>
  <div class="marketplace-nft-detail">
    <div class="nft-header">
      <h3>{{ nft?.name }}</h3>
      <van-icon name="cross" class="close-icon" @click="$emit('update:show', false)" />
    </div>

    <div class="nft-content">
      <div class="nft-left">
        <div class="nft-image">
          <img :src="formatUrl(nft?.imageUrl)" :alt="nft?.name" />
        </div>
        <div class="nft-info">
          <div class="info-item">
            <span class="label">Token ID</span>
            <span class="value">{{ nft?.tokenId }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.level') }}</span>
            <span class="value">Lv.{{ nft?.level }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.careMethod') }}</span>
            <span class="value">{{ nft?.fostered === 0 ? t('components.nftDetail.unknown') : nft?.fostered === 1 ? t('components.nftDetail.fostered') : t('components.nftDetail.selfCare') }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.exp') }}</span>
            <span class="value">{{ nft?.exp }}/{{ nft?.requiredExp }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.gender') }}</span>
            <span class="value">{{ nft?.gender === 1 ? t('components.nftDetail.male') : t('components.nftDetail.female') }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.breedType') }}</span>
            <span class="value">{{ nft?.breedType }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('components.nftDetail.birthDate') }}</span>
            <span class="value">{{ formatDate(nft?.mintTime) }}</span>
          </div>
          <div class="info-item-seller">
            <span class="label">{{ t('components.nftDetail.seller') }}</span>
            <span class="value">{{ nft?.seller }}</span>
          </div>
        </div>
      </div>

      <div class="nft-right">
        <div class="price-section">
          <div class="price-tag">
            <span class="price-label">{{ t('components.nftDetail.price') }}</span>
            <span class="price-value">{{ nft?.price }} {{ nft?.payment === '0' ? 'ETH' : 'USDC' }}</span>
          </div>
          <van-button 
            type="primary" 
            block 
            class="buy-btn"
            @click="$emit('buy', nft)"
          >
            {{ t('components.nftDetail.buyNow') }}
          </van-button>
        </div>

        <div class="nft-records">
          <h4>{{ t('components.nftDetail.dailyRecords') }}</h4>
          <van-list
            v-model:loading="loading"
            :finished="finished"
            :finished-text="t('components.nftDetail.noMore')"
            @load="loadRecords"
          >
            <div class="record-list">
              <div v-for="(record, index) in nft?.records" :key="index" class="record-item">
                <div class="record-header">
                  <div class="record-date">{{ record.date }}</div>
                </div>
                <div class="record-content">
                  <p v-if="record.text" class="record-text">{{ record.text }}</p>
                  <div v-if="record.images && record.images.length > 0" class="record-images">
                    <img 
                      v-for="(img, imgIndex) in record.images.slice(0, 3)" 
                      :key="imgIndex" 
                      :src="formatUrl(img)" 
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
      </div>
    </div>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showImagePreview"
      :images="previewImages"
      :start-position="previewIndex"
    />

    <!-- 视频预览 -->
    <van-popup
      v-model:show="showVideoPreview"
      closeable
      round
      :style="{ width: '100%', height: '100%' }"
    >
      <div class="video-preview-container">
        <video
          ref="videoPlayer"
          :src="previewVideoUrl"
          controls
          autoplay
          class="video-player"
        ></video>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { formatAddress, formatDate, formatUrl } from '@/utils/util'
import request from '@/utils/request'
import { useI18n } from 'vue-i18n'
import {store} from '@/store/appkitStore'

const { t } = useI18n()

const props = defineProps({
  nft: {
    type: Object,
    default: () => null
  }
})

const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)

// 图片预览相关
const showImagePreview = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)

// 视频预览相关
const showVideoPreview = ref(false)
const previewVideoUrl = ref('')
const videoPlayer = ref(null)

const formatBreedType = (type) => {
  switch(type) {
    case '1': return t('components.nftDetail.normal')
    case '2': return t('components.nftDetail.rare')
    case '3': return t('components.nftDetail.legendary')
    default: return t('components.nftDetail.unknown')
  }
}

const loadRecords = async () => {
  if (!props.nft?.tokenId) return
  try {
    loading.value = true
    const res = await request.get('/diary/list', {
      params: {
        tokenId: props.nft?.tokenId,
        pageSize: pageSize.value,
        pageNum: pageNum.value
      }
    })
    if (res.code === 200) {
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
        props.nft.records = processedRows
      } else {
        props.nft.records = [...props.nft.records, ...processedRows]
      }
      
      if (res.rows.length < pageSize.value) {
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
            const index = props.nft.records.findIndex(r => r.id === record.id)
            if (index !== -1) {
              props.nft.records[index].text = text
            }
          } catch (error) {
            console.error(t('components.list.loadTextFailed'), error)
          }
        }
      })

    }
  } catch (error) {
    // console.error(t('components.list.loadRecordsFailed'), error)
    finished.value = true
  } finally {
    loading.value = false
  }
}

const previewImage = (currentImage, images) => {
  previewImages.value = images
  previewIndex.value = images.indexOf(currentImage)
  showImagePreview.value = true
}

const previewVideo = (videoUrl) => {
  previewVideoUrl.value = formatUrl(videoUrl)
  showVideoPreview.value = true
}

// 监听 NFT 变化
watch(
  () => props.nft,
  (newNFT) => {
    if (newNFT) {
      // resetPagination()
      loadRecords()
    }
  }
)

onMounted(() => {
  // loadRecords()
})
</script>

<style lang="scss" scoped>
.marketplace-nft-detail {
  padding: 1.5rem;
  background: var(--mt-bg);
  color: var(--mt-text);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .nft-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .close-icon {
      font-size: 1.2rem;
      color: var(--mt-text-secondary);
      cursor: pointer;
    }
  }

  .nft-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;

    @media (min-width: 768px) {
      flex-direction: row;
    }

    .nft-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      .nft-image {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 12px;
        overflow: hidden;
        background: var(--mt-bg-secondary);

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .nft-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        background: var(--mt-bg-secondary);
        padding: 1.5rem;
        border-radius: 12px;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .label {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
          }

          .value {
            color: var(--mt-text);
            font-weight: 500;
            font-size: 1.1rem;
          }
        }
        .info-item-seller {
          grid-column: 1 / -1;
          border-top: 1px solid var(--mt-border);
          padding-top: 1.5rem;
          margin-top: 0.5rem;
          
          .label {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
            margin-right: 1rem;
          }

          .value {
            color: var(--mt-text);
            font-weight: 500;
            font-size: 0.9rem;
          }
        }
      }
    }

    .nft-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      .price-section {
        .price-tag {
          background: var(--mt-bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;

          .price-label {
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
          }

          .price-value {
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--mt-primary);
          }
        }

        .buy-btn {
          height: 44px;
          border-radius: 22px;
          font-size: 1rem;
          font-weight: 500;
          background: var(--mt-primary);
          border-color: var(--mt-primary);
          color: #fff;

          &:active {
            opacity: 0.9;
          }
        }
      }

      .nft-records {
        flex: 1;
        background: var(--mt-bg-secondary);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;

        h4 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--mt-text);
        }

        .record-list {
          flex: 1;
          overflow-y: auto;

          .record-item {
            padding: 1rem;
            border-bottom: 1px solid var(--mt-border);
            background: var(--mt-bg);

            &:last-child {
              border-bottom: none;
            }

            .record-header {
              margin-bottom: 0.5rem;

              .record-date {
                color: var(--mt-text-secondary);
                font-size: 0.9rem;
              }
            }

            .record-content {
              .record-text {
                color: var(--mt-text);
                font-size: 1rem;
                line-height: 1.5;
                margin: 0 0 0.5rem;
              }

              .record-images {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
                margin-bottom: 0.5rem;

                img {
                  width: 100%;
                  aspect-ratio: 1;
                  object-fit: cover;
                  border-radius: 8px;
                  cursor: pointer;
                }

                .more-images {
                  width: 100%;
                  aspect-ratio: 1;
                  background: rgba(0, 0, 0, 0.5);
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 1.2rem;
                  font-weight: 500;
                }
              }

              .record-video-preview {
                position: relative;
                width: 100%;
                aspect-ratio: 16/9;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;

                video {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .play-icon {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 48px;
                  height: 48px;
                  background: rgba(0, 0, 0, 0.5);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 1.5rem;
                }
              }
            }
          }
        }
      }
    }
  }
}

.video-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;

  .video-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style> 