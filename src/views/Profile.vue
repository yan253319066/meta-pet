<template>
  <div class="profile">
    <div class="profile-header">
      <div class="user-info">
        <img :src="userAvatar" alt="User Avatar" class="avatar" />
        <div class="info">
          <!-- <h2 class="address">{{ formatAddress(account.address) }}</h2> -->
          <div class="stats">
            <div class="stat-item">
              <span class="label">{{ t('profile.nftCount') }}</span>
              <span class="value">{{ nftCount }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('profile.inviteCount') }}</span>
              <span class="value">{{ inviteCount }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('profile.points') }}</span>
              <span class="value">{{ userInfo.point }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <van-tabs v-model:active="activeTab" class="profile-tabs">
      <van-tab :title="t('profile.myNFT')">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :finished-text="t('profile.noMore')"
          @load="myNft"
        >
          <div class="nft-grid">
            <div 
              v-for="(nft, index) in nftList" 
              :key="index" 
              class="nft-card" 
              @click="showNFTDetail(nft)"
            >
              <div class="nft-image-container">
                <img :src="formatUrl(nft.imageUrl)" :alt="nft.name" class="nft-image" />
                <div class="nft-overlay">
                  <div class="nft-name">{{ nft.name }}</div>
                  <div class="nft-level">Lv.{{ nft.level }}</div>
                  <div class="nft-exp">
                    <span class="exp-text">EXP: {{ nft.exp }}/{{ nft.requiredExp }}</span>
                    <div class="exp-bar">
                      <div class="exp-progress" :style="{ width: (nft.exp / nft.requiredExp * 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
                <div v-if="nft.status === 1" class="review-mask">
                  <div class="review-text">{{ t('profile.reviewing') }}</div>
                </div>
              </div>
              <div class="nft-info">
                <div class="nft-actions">
                  <van-button 
                    v-if="nft.isListed === 0"
                    type="primary" 
                    size="small" 
                    class="action-btn"
                    @click.stop="listNFTHandler(nft)"
                  >
                    {{ t('profile.list') }}
                  </van-button>
                  <van-button 
                    v-else
                    type="danger" 
                    size="small" 
                    class="action-btn"
                    @click.stop="unlistNFTHandler(nft)"
                  >
                    {{ t('profile.unlist') }}
                  </van-button>
                  <van-button 
                    v-if="nft.exp >= nft.requiredExp"
                    type="primary" 
                    size="small" 
                    class="action-btn"
                    @click.stop="upgradeNFTHandler(nft)"
                  >
                    {{ t('profile.upgrade') }}
                  </van-button>
                  <van-button 
                    type="primary" 
                    size="small" 
                    class="action-btn"
                    @click.stop="goToRecord(nft.tokenId)"
                  >
                    {{ t('profile.takePhoto') }}
                  </van-button>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-tab>

      <van-tab :title="t('profile.mintRWA')">
        <MintRWA />
      </van-tab>

      <van-tab :title="t('profile.invite')">
        <div class="invite-section">
          <div class="invite-card">
            <!-- <div class="invite-link">
              <input type="text" :value="inviteLink" readonly />
              <van-button type="primary" size="small" @click="copyLink">复制</van-button>
            </div> -->
            <div class="poster-container">
              <div class="poster" @click="previewPoster">
                <img :src="posterImage" :alt="t('profile.invitePoster')" />
                <div class="qrcode-overlay">
                  <img :src="qrcodeImage" :alt="t('profile.inviteQRCode')" />
                </div>
              </div>
              <div class="action-buttons">
                <van-button type="primary" @click="saveToPhone">{{ t('profile.save') }}</van-button>
                <van-button type="primary" @click="showShare = true">{{ t('profile.shareButton') }}</van-button>
                <van-share-sheet v-model:show="showShare" :title="t('profile.shareTitle')" :options="options" @select="onSelect"/>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab :title="t('profile.delivery.title')">
        <div class="delivery-section">
          <van-tabs v-model:active="deliveryTab">
            <van-tab :title="t('profile.inProgress')">
              <template v-if="activeDeliveries.length > 0">
                <div class="delivery-list">
                  <div v-for="(delivery, index) in activeDeliveries" :key="index" class="delivery-card">
                    <div class="delivery-header">
                      <span class="status">{{ formatStatus(delivery.status) }}</span>
                      <span class="date">{{ formatDate(delivery.createTime) }}</span>
                    </div>
                    <div class="delivery-info">
                      <div class="info-item">
                        <span class="label">{{ t('profile.trackingNumber') }}</span>
                        <span class="value">{{ delivery.deliveryNumber == undefined ? 'Awaiting Shipment':delivery.deliveryNumber }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">Token ID</span>
                        <span class="value">{{ delivery.tokenId }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ t('profile.recipient') }}</span>
                        <span class="value">{{ delivery.recipientName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ t('profile.phone') }}</span>
                        <span class="value">{{ delivery.phone }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ t('profile.address') }}</span>
                        <span class="value">{{ delivery.deliveryAddress }}</span>
                      </div>
                    </div>
                    <div class="delivery-timeline">
                      <div v-for="(step, stepIndex) in delivery.timeline" :key="stepIndex" class="timeline-item">
                        <div class="dot"></div>
                        <div class="content">
                          <span class="time">{{ step.time }}</span>
                          <span class="description">{{ step.description }}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <van-button
                        type="primary" 
                        size="small"
                        class="action-btn"
                        @click="handleConfirmDelivery(delivery.id, delivery.tokenId)"
                      >{{ t('profile.confirmDelivery') }}</van-button>
                    </div>
                  </div>
                </div>
              </template>
              <EmptyState
                  v-else
                  image="search"
                  :description="t('profile.noMore')"
                />
            </van-tab>
            <van-tab :title="t('profile.history')">
                <template v-if="historyDeliveries.length > 0">
                <div class="delivery-list">
                  <div v-for="(delivery, index) in historyDeliveries" :key="index" class="delivery-card">
                    <div class="delivery-header">
                      <span class="status">{{ formatStatus(delivery.status) }}</span>
                      <span class="date">{{ formatDate(delivery.date) }}</span>
                    </div>
                    <div class="delivery-info">
                      <div class="info-item">
                        <span class="label">{{ t('profile.trackingNumber') }}</span>
                        <span class="value">{{ delivery.deliveryNumber }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">Token ID</span>
                        <span class="value">{{ delivery.tokenId }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ t('profile.recipient') }}</span>
                        <span class="value">{{ delivery.recipientName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ t('profile.phone') }}</span>
                        <span class="value">{{ delivery.phone }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ t('profile.address') }}</span>
                        <span class="value">{{ delivery.deliveryAddress }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </template>
                <EmptyState
                  v-else
                  image="search"
                  :description="t('profile.noHistory')"
                />
              </van-tab>
          </van-tabs>
        </div>
      </van-tab>
    </van-tabs>

    <!-- NFT详情弹窗 -->
    <van-popup v-model:show="showNFTDetailPopup" position="bottom" round>
      <NFTDetail :nft="selectedNFT" :refresh="myNft" />
    </van-popup>

    <!-- 海报预览弹窗 -->
    <van-image-preview
      v-model:show="showPosterPreview"
      :images="[posterImage]"
      @close="showPosterPreview = false"
    />

    <!-- NFT上架弹窗 -->
    <ListNFTPopup
      v-model:show="showListPopup"
      :nft="selectedNFTForList"
      @success="myNft"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useLoadingStore } from '@/store/loadingStore'
import { showToast } from 'vant'
import NFTDetail from '@/components/NFTDetail.vue'
import ListNFTPopup from '@/components/ListNFTPopup.vue'
import MintRWA from '@/views/MintRWA.vue'
import QRCode from 'qrcode'
import request from '@/utils/request'
import { useRouter, useRoute } from 'vue-router'
import { appKit } from '@/config/appKit'
import { unlistNft, upgradeNft, confirmDelivery,referrerCount,getBalanceEth,upFee } from '@/services/wallet'
import EmptyState from '@/components/EmptyState.vue'
import {formatDate,formatUrl} from '@/utils/util'
import {store} from '@/store/appkitStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loadingStore = useLoadingStore();

const userAvatar = ref('/images/logo.png')
const nftCount = ref(0)
const inviteCode = ref('')
const inviteCount = ref(0)
const userInfo = ref({})
const activeTab = ref(0)
const deliveryTab = ref(0)
const showNFTDetailPopup = ref(false)
const selectedNFT = ref(null)
const nftList = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)

const router = useRouter()
const route = useRoute()

const formatStatus = (status) => {
  if(status == 0) return t('profile.preparing')
  else if(status == 1) return t('profile.shipping')
  else if(status == 2) return t('profile.completed')
}

const myNft = async () => {
  try {
    loadingStore.showLoading(t('profile.loadingNFTList'))
    const res = await request.get('/nft/list', {
      params: {
        pageSize: pageSize.value,
        pageNum: pageNum.value
      }
    })
    
    if (pageNum.value === 1) {
      nftList.value = res.rows
    } else {
      nftList.value = [...nftList.value, ...res.rows]
    }
  
    // 判断是否加载完成
    if (res.rows.length < pageSize.value) {
      finished.value = true
    } else if (loading.value) {
      pageNum.value++
    }
  } catch (error) {
    // console.error(t('profile.getNFTListFailed'), error)
    // showToast(t('profile.getNFTListFailed'))
    nftList.value = []
    finished.value = true
  } finally {
    loadingStore.hideLoading()
  }
}

const handleConfirmDelivery = async (id, tokenId) => {
  try {
    loadingStore.showLoading()
    const hash = await confirmDelivery(tokenId)
    showToast(t('profile.confirmDeliverySuccess'))
    progressList()
  } catch (error) {
    console.error(t('profile.confirmDeliveryFailed'), error)
    showToast(t('profile.confirmDeliveryFailed'))
  }finally{
    loadingStore.hideLoading()
  }
}

// 重置分页
const resetPagination = () => {
  pageNum.value = 1
  finished.value = false
  nftList.value = []
}

const inviteLink = ref('')
const qrcodeImage = ref('')
const posterImage = ref('/images/poster.jpeg')

const activeDeliveries = ref()

const historyDeliveries = ref()

const copyLink = () => {
  navigator.clipboard.writeText(inviteLink.value)
  showToast(t('profile.copySuccess'))
}

const showPosterPreview = ref(false)

const previewPoster = () => {
  showPosterPreview.value = true
}

const saveToPhone = async () => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const poster = document.querySelector('.poster img')
    const qrcode = document.querySelector('.qrcode-overlay img')
    
    // 设置画布大小
    canvas.width = poster.naturalWidth
    canvas.height = poster.naturalHeight
    
    // 绘制海报
    ctx.drawImage(poster, 0, 0, canvas.width, canvas.height)
    
    // 绘制二维码
    const qrcodeSize = canvas.width * 0.2
    const qrcodeX = canvas.width - qrcodeSize - 20
    const qrcodeY = canvas.height - qrcodeSize - 20
    ctx.drawImage(qrcode, qrcodeX, qrcodeY, qrcodeSize, qrcodeSize)
    
    // 转换为图片
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = 'poster.jpg'
    link.href = dataUrl
    link.click()
    
    showToast(t('profile.saveSuccess'))
  } catch (error) {
    console.error(t('profile.saveFailed'), error)
    showToast(t('profile.saveFailed'))
  }
}

const showShare = ref(false)
const options = [
  { name: t('profile.share.wechat'), icon: 'wechat' },
  { name: t('profile.share.moments'), icon: 'wechat-moments' },
  { name: t('profile.share.weibo'), icon: 'weibo' },
  { name: t('profile.share.twitter'), icon: 'share-o' },
  { name: t('profile.share.copyLink'), icon: 'link' }
]

const onSelect = async (option) => {
  showShare.value = false
  
  try {
    const shareData = {
      title: t('profile.shareTitle'),
      text: t('profile.invitePoster'),
      url: inviteLink.value,
      image: posterImage.value
    }

    switch (option.name) {
      case t('profile.share.wechat'):
        // 使用微信开放平台分享接口
        const wechatUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=YOUR_APPID&redirect_uri=${encodeURIComponent(shareData.url)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
        window.open(wechatUrl, '_blank')
        break

      case t('profile.share.moments'):
        // 使用微信开放平台分享接口
        const momentsUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=YOUR_APPID&redirect_uri=${encodeURIComponent(shareData.url)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
        window.open(momentsUrl, '_blank')
        break

      case t('profile.share.weibo'):
        const weiboUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&pic=${encodeURIComponent(shareData.image)}`
        window.open(weiboUrl, '_blank')
        break

      case t('profile.share.twitter'):
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}`
        window.open(twitterUrl, '_blank')
        break

      case t('profile.share.copyLink'):
        await navigator.clipboard.writeText(shareData.url)
        showToast(t('profile.share.copySuccess'))
        break

      default:
        // 使用 Web Share API
        if (navigator.share) {
          try {
            await navigator.share(shareData)
            showToast(t('profile.shareSuccess'))
          } catch (error) {
            if (error.name !== 'AbortError') {
              showToast(t('profile.shareFailed'))
            }
          }
        }
    }
  } catch (error) {
    console.error(t('profile.shareFailed'), error)
    showToast(t('profile.shareFailed'))
  }
}

const showNFTDetail = (nft) => {
  selectedNFT.value = nft
  showNFTDetailPopup.value = true
}

const generateQRCode = async () => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(inviteLink.value, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    qrcodeImage.value = qrCodeDataUrl
    // showToast(t('profile.generateQRCodeSuccess'))
  } catch (error) {
    console.error(t('profile.generateQRCodeFailed'), error)
    // showToast(t('profile.generateQRCodeFailed'))
  }
}

const goToRecord = (tokenId) => {
  router.push(`/record/${tokenId}`)
}

const showListPopup = ref(false)
const selectedNFTForList = ref(null)

const listNFTHandler = (nft) => {
  selectedNFTForList.value = nft
  showListPopup.value = true
}

const unlistNFTHandler = async (nft) => {
  try {
    loadingStore.showLoading()
    const hash = await unlistNft(nft.tokenId)
    if (hash) {
      showToast(t('profile.unlistSuccess'))
      myNft()
    }
  } catch (error) {
    console.error(t('profile.unlistFailed'), error)
    showToast(t('profile.unlistFailed'))
  }finally{
    loadingStore.hideLoading()
  }
}

const upgradeNFTHandler = async (nft) => {
  try {
    loadingStore.showLoading()
    const fee = await upFee()
    const ethBalance = await getBalanceEth(store.accountState.address)
    if(ethBalance < fee) return showToast(t('marketplace.insufficientBalance'))
    const hash = await upgradeNft(nft.tokenId, fee)
    if (hash) {
      showToast(t('profile.upgradeSuccess'))
      myNft()
    }
  } catch (error) {
    console.error(t('profile.upgradeFailed'), error)
    showToast(t('profile.upgradeFailed'))
  }finally{
    loadingStore.hideLoading()
  }
}
const progressList = async () => {
  const res = await request.get('/delivery/progressList')
  for (let i = 0; i < res.rows.length; i++) {
    const element = res.rows[i];
    element.timeline = [
      // {
      //   time: '2024-03-15 10:00',
      //   description: '已发货'
      // },
      // {
      //   time: '2024-03-15 12:00',
      //   description: '已到达深圳转运中心'
      // }
    ]
  }
  activeDeliveries.value = res?.rows
}

onMounted(() => {
  if(localStorage.getItem("meta-token")){
    try {
      // loadingStore.showLoading()
      request.get('/nft/nftCount').then((res)=>{
        nftCount.value = res?.data
      })
      request.get("getInfo").then((res)=>{
        userInfo.value = res?.data?.user;
      }).catch((error)=>{
        userInfo.value = {point:0}
      })
      request.get("getInviteCode").then((res)=>{
        inviteCode.value = res?.data.inviteCode
        const host = window.location.host;
        inviteLink.value = host+'/?invite='+inviteCode.value
      })
      progressList()
      request.get('/delivery/completedList').then((res)=>{
        historyDeliveries.value = res?.rows
      })
      // generateQRCode()
      setTimeout(() => {
        referrerCount().then((res)=>{
          inviteCount.value = res;
        })
      }, 3000);
    } catch (error) {
      console.error(error)
    }finally{
      // loadingStore.hideLoading()
    }
    
  }else{
    appKit.open()
  }
})

// 监听邀请链接变化，重新生成二维码
watch(inviteLink, () => {
  generateQRCode()
})
</script>

<style lang="scss" scoped>
.profile {
  padding: 0;
  background: var(--mt-bg);
  color: var(--mt-text);
}

.profile-header {
  padding: 2rem;
  background: var(--mt-bg-secondary);
  border-radius: 0 0 20px 20px;
  margin-bottom: 1rem;

  .user-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 2px solid var(--mt-primary);
    }

    .info {
      flex: 1;

      .address {
        margin: 0 0 1rem;
        font-size: 1.2rem;
        color: var(--mt-text);
      }

      .stats {
        display: flex;
        gap: 2rem;

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .label {
            font-size: 0.85rem;
            color: var(--mt-text-secondary);
          }

          .value {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--mt-primary);
          }
        }
      }
    }
  }
}

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

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem 0;

  .nft-card {
    background: var(--mt-bg-secondary);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s ease;

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

      .review-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;

        .review-text {
          color: #fff;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.5rem 0.5rem;
          background: var(--mt-primary);
          border-radius: 8px;
        }
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

        .nft-exp {
          margin-top: auto;
          padding-bottom: 0.5rem;

          .exp-text {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
            display: block;
          }

          .exp-bar {
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            overflow: hidden;

            .exp-progress {
              height: 100%;
              background: var(--mt-primary);
              transition: width 0.3s ease;
            }
          }
        }
      }
    }

    .nft-info {
      padding: 1rem;

      .nft-actions {
        display: flex;
        gap: 0.5rem;

        .action-btn {
          flex: 1;
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
}

.invite-section {
  padding: 1rem 0;

  .invite-card {
    background: var(--mt-bg-secondary);
    border-radius: 12px;
    padding: 0.5rem;
    margin-bottom: 1rem;

    .invite-link {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      align-items: center;

      input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--mt-border);
        border-radius: 8px;
        background: var(--mt-bg);
        color: var(--mt-text);
      }

      .van-button {
        height: 36px;
        background: var(--mt-primary);
        border-color: var(--mt-primary);
      }
    }

    .poster-container {
      .poster {
        position: relative;
        width: 100%;
        max-width: 375px;
        margin: 0 auto;
        aspect-ratio: 9/16;
        overflow: hidden;
        border-radius: 8px;
        background: var(--mt-bg);

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .qrcode-overlay {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 65px;
          height: 65px;
          background: white;
          padding: 2px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1rem;

        .van-button {
          flex: 1;
          max-width: 200px;
          background: var(--mt-primary);
          border-color: var(--mt-primary);
        }
      }
    }
  }
}

.delivery-section {
  padding: 1rem 0;

  .delivery-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .delivery-card {
    background: var(--mt-bg-secondary);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;

    .delivery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .status {
        color: var(--mt-primary);
        font-weight: 500;
      }

      .date {
        color: var(--mt-text-secondary);
        font-size: 0.9rem;
      }
    }

    .delivery-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;

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
        }
      }
    }

    .delivery-timeline {
      position: relative;
      padding-left: 1rem;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--mt-border);
      }

      .timeline-item {
        position: relative;
        padding-bottom: 1rem;

        &:last-child {
          padding-bottom: 0;
        }

        .dot {
          position: absolute;
          left: -1.25rem;
          top: 0.25rem;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--mt-primary);
        }

        .content {
          .time {
            display: block;
            color: var(--mt-text-secondary);
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .description {
            color: var(--mt-text);
          }
        }
      }
    }

    .action-btn {
      background: var(--mt-primary);
      border-color: var(--mt-primary);
      color: #fff;
      height: 36px;
      border-radius: 18px;
      font-size: 0.9rem;
      font-weight: 500;

      &:active {
        opacity: 0.9;
      }
    }
  }
}

.qrcode-popup {
  padding: 1.5rem;
  text-align: center;

  h3 {
    margin: 0 0 1rem;
    color: var(--mt-text);
  }

  img {
    width: 200px;
    height: 200px;
    margin: 0 auto 1rem;
  }

  p {
    margin: 0 0 1rem;
    color: var(--mt-text-secondary);
  }
}

.custom-share {
  padding: 1rem;

  .share-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      color: var(--mt-text);
    }
  }

  .share-content {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;

    .share-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;

      img {
        width: 48px;
        height: 48px;
        border-radius: 8px;
      }

      span {
        font-size: 0.9rem;
        color: var(--mt-text);
      }
    }
  }

  .share-footer {
    .van-button {
      background: var(--mt-bg-secondary);
      color: var(--mt-text);
      border: none;
    }
  }
}
</style>