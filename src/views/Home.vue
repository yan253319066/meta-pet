<template>
  <div class="home">
    <PetGiftDialog />
    <van-swipe 
      class="banner-swiper" 
      :autoplay="3000" 
      indicator-color="var(--mt-primary)"
      :loop="true"
      :show-indicators="true"
      :touchable="true"
      :stop-propagation="true"
      :width="bannerWidth"
    >
      <van-swipe-item v-for="(item, index) in bannerItems" :key="index">
        <div class="banner-item">
          <img :src="item.image" :alt="item.title" />
        </div>
      </van-swipe-item>
    </van-swipe>

    <div class="section">
      <div class="section-header">
        <h2>{{ $t('home.popularPet') }}</h2>
        <van-button class="view-all-btn" type="primary" @click="handlePopular">{{ $t('home.viewAll') }}</van-button>
      </div>
      <div class="popular-items">
        <div v-for="(item, index) in popularItems" :key="index" class="item-card" @click="handleNFTClick(item)">
          <img :src="formatUrl(item.imageUrl)" :alt="item.title" />
          <div class="item-info">
            <div class="creator">
              <img :src="formatUrl(item.imageUrl)" alt="creator" class="avatar" />
              <span>{{ formatAddress(item.address) }}</span>
              <span class="likes">{{ item.likes }}</span>
            </div>
            <h3>{{ item.name }}</h3>
            <div class="price">
              <span>{{item.breedType}}</span>
              <strong>Lv. {{ item.level }} </strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>{{ t('home.rankingList') }}</h2>
        <van-button class="view-all-btn" type="primary" @click="handleRanking">{{ t('home.viewAll') }}</van-button>
      </div>
      <div class="ranking-list">
        <div class="ranking-header">
          <span class="rank">{{ t('home.rank') }}</span>
          <span class="info">{{ t('home.name') }}</span>
          <span class="level">{{ t('home.level') }}</span>
        </div>
        <div v-for="(item, index) in rankingItems" :key="index" class="ranking-item">
          <span class="rank">{{ index + 1 }}</span>
          <div class="info">
            <img :src="formatUrl(item.imageUrl)" :alt="item.address" class="avatar" />
            <div class="name-container">
              <span class="name">{{ formatAddress(item.address) }}</span>
              <span class="breed-type">{{ item.name }}</span>
            </div>
          </div>
          <span class="level">{{ item.level }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>{{ $t('home.popularityChart') }}</h2>
        <van-button class="view-all-btn" type="primary" @click="handleChart">{{ $t('home.viewAll') }}</van-button>
      </div>
      <div class="popularity-grid">
        <div v-for="(item, index) in popularityItems" :key="index" class="popularity-card">
          <div class="images">
            <img v-for="(nft, imgIndex) in item.nftList" :key="imgIndex" :src=" formatUrl(nft.imageUrl)" :alt="item.name" @click="handleNFTClick2(nft)" />
          </div>
          <div class="info">
            <div class="user">
              <img :src="item.avatar" :alt="item.name" class="avatar" />
              <span>{{ formatAddress(item.name) }}</span>
            </div>
            <span class="items">{{ item.items }} Items</span>
          </div>
        </div>
      </div>
      <!-- <div class="view-more">
        <van-button type="primary" size="small">View More</van-button>
      </div> -->
    </div>

    <van-popup
      v-model:show="showNFTDetail"
      position="bottom"
      round
      :style="{ height: '80%' }"
    >
      <MarketplaceNFTDetail
        :nft="selectedNFT"
        @update:show="showNFTDetail = false"
        @buy="handleBuy"
      />
    </van-popup>

    <van-popup
      v-model:show="showNFTDetail2"
      position="bottom"
      round
      :style="{ height: '80%' }"
    >
      <NFTDetail
        :nft="selectedNFT2"
        @update:show="showNFTDetail2 = false"
      />
    </van-popup>

    <FloatingDocs />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PetGiftDialog from '@/components/PetGiftDialog.vue'
import request from '@/utils/request'
import { formatAddress, formatUrl } from '@/utils/util'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import { useLoadingStore } from '@/store/loadingStore'
import NFTDetail from '@/components/NFTDetail.vue'
import MarketplaceNFTDetail from '@/components/MarketplaceNFTDetail.vue'
import { useI18n } from 'vue-i18n'
import { buyNftByEth, buyNftByUsdc, getBalance, getUsdcBalance } from '@/services/wallet'
import { appKit } from '@/config/appKit'
import { store } from '@/store/appkitStore'
import FloatingDocs from '@/components/FloatingDocs.vue'

const { t } = useI18n()

const loadingStore = useLoadingStore()

const router = useRouter()

const bannerWidth = ref(0)

const showNFTDetail = ref(false)
const selectedNFT = ref(null)

const showNFTDetail2 = ref(false)
const selectedNFT2 = ref(null)

const handlePopular = () => {
  router.push({
    path: '/marketplace',
    query: {

    }
  })
}

const handleRanking = () => {
  showToast(t('home.comingSoon'))
} 

const handleChart = () => {
  showToast(t('home.comingSoon'))
}

const handleNFTClick = (nft) => {
  selectedNFT.value = nft
  showNFTDetail.value = true
}

const handleNFTClick2 = (nft) => {
  selectedNFT2.value = nft
  showNFTDetail2.value = true
}

const handleBuy = async (nft) => {
  try {
    if(!localStorage.getItem("meta-token")) return appKit.open()
    loadingStore.showLoading(t('marketplace.processingPurchase'))
    let hash = null
    if(nft.payment == 0){
      const ethBalance = await getBalance(store.accountState.address);
      if(ethBalance < nft.price) return showToast(t('marketplace.insufficientBalance'))
      hash = await buyNftByEth(
        nft.tokenId,
        nft.price
      )
    }
    else {
      const tokenBalance = await getUsdcBalance(store.accountState.address, true)
      if(tokenBalance < nft.price) return showToast(t('marketplace.insufficientBalance'))
      hash = await buyNftByUsdc(
        nft.tokenId
      )
    }
    
    if (hash) {
      showToast(t('marketplace.purchaseSuccess'))
      showNFTDetail.value = false
      // 刷新列表
      const res = await request.get('/market/listed', {
        params: {
          pageSize: 4,
          pageNum: 1
        }
      })
      popularItems.value = res?.rows
    }
  } catch (error) {
    console.error(t('marketplace.purchaseFailed'), error)
    showToast(t('marketplace.purchaseFailed'))
  } finally {
    loadingStore.hideLoading()
  }
}
 
const bannerItems = ref([
  {
    image: '/images/banner1.jpg',
    title: 'Meta Pet Banner 1'
  },
  {
    image: '/images/banner2.jpg',
    title: 'Meta Pet Banner 2'
  },
  {
    image: '/images/banner3.jpg',
    title: 'Meta Pet Banner 3'
  }
  ,
  {
    image: '/images/banner4.jpg',
    title: 'Meta Pet Banner 4'
  },
  {
    image: '/images/banner5.jpg',
    title: 'Meta Pet Banner 5'
  }
])

const popularItems = ref()

const rankingItems = ref()

const popularityItems = ref()

onMounted(async() => {
  bannerWidth.value = document.querySelector('.banner-swiper')?.clientWidth || window.innerWidth
  window.addEventListener('resize', () => {
    bannerWidth.value = document.querySelector('.banner-swiper')?.clientWidth || window.innerWidth
  })

  // 从 URL 中获取邀请码
  const urlParams = new URLSearchParams(window.location.search)
  const inviteCode = urlParams.get('invite')
  if(inviteCode)
    localStorage.setItem("parentInviteCode", inviteCode);

  try {
    // loadingStore.showLoading()
    request.get('/market/popularList').then((res)=>{
      popularItems.value = res?.data
    }).catch((error)=>{
      popularItems.value = [
        {
            "id": 124,
            "tokenId": "1023",
            "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "0.0001",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619795,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619335,
            "name": "Veljko Sekulić",
            "exp": 0,
            "level": 120,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Mauremys sinensis",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 517
        },
        {
            "id": 102,
            "tokenId": "1001",
            "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
            "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "buyer": null,
            "price": "0.0001",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619507,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619199,
            "name": "Önal Sezek",
            "exp": 0,
            "level": 116,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Mauremys sinensis",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 454
        },
        {
            "id": 105,
            "tokenId": "1004",
            "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "0.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619547,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619219,
            "name": "Emily Olsen",
            "exp": 0,
            "level": 110,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 372
        },
        {
            "id": 127,
            "tokenId": "1026",
            "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "0.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619829,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619351,
            "name": "Marcus Andersen",
            "exp": 0,
            "level": 105,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 316
        }
    ]
    })
    request.get('/nft/rankingList').then((res)=>{
      rankingItems.value = res?.data
    }).catch((error)=>{
      rankingItems.value = [
        {
            "id": 158,
            "address": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "tokenId": "1023",
            "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
            "name": "Veljko Sekulić",
            "level": 120,
        },
        {
            "id": 136,
            "address": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "tokenId": "1001",
            "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
            "name": "Önal Sezek",
            "level": 116,
        },
        {
            "id": 139,
            "address": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "tokenId": "1004",
            "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
            "name": "Emily Olsen",
            "level": 110,
        },
        {
            "id": 161,
            "address": "0x9c134adc6587731460e3868201149414cb2e8008",
            "tokenId": "1026",
            "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
            "name": "Marcus Andersen",
            "level": 105,
        },
        {
            "id": 157,
            "address": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
            "tokenId": "1022",
            "imageUrl": "QmNUba3LFaEm8FbJjqtxmoPewGogEsH9xrfLLURadiCyjF",
            "name": "Chinese Pond Turtle",
            "level": 97,
        },
        {
            "id": 160,
            "address": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "tokenId": "1025",
            "imageUrl": "QmWThnS8q8t65KcgnQVuDHzwjaAnFVGDmEXTWE18dGeUzf",
            "name": "Esma Ozansoy",
            "level": 93,
        },
        {
            "id": 159,
            "address": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "tokenId": "1024",
            "imageUrl": "QmZwqG32nZZTskKUNQm5jyod9evBoUq6T2PDqb758EThYB",
            "name": "Macit Tokatlıoğlu",
            "level": 89,
        },
        {
            "id": 140,
            "address": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "tokenId": "1005",
            "imageUrl": "QmZkbijAtEp8dvfVMUYnSGRUS4jYCfH7NPfCFU5xPW87Pf",
            "name": "Simplício Porto",
            "level": 75,
        },
        {
            "id": 162,
            "address": "0x9c134adc6587731460e3868201149414cb2e8008",
            "tokenId": "1027",
            "imageUrl": "QmZkbijAtEp8dvfVMUYnSGRUS4jYCfH7NPfCFU5xPW87Pf",
            "name": "Boyko Stogniy",
            "level": 70,
        },
        {
            "id": 135,
            "address": "0x5aa0ca5fcc22f8b080916eb494f83c5d97746837",
            "tokenId": "1000",
            "imageUrl": "QmNUba3LFaEm8FbJjqtxmoPewGogEsH9xrfLLURadiCyjF",
            "name": "Hitesh Dalvi",
            "level": 63,
        }
    ]
    })
    request.get('/nft/popularChart').then((res)=>{
      popularityItems.value = res?.data.filter(popularChart => {
        if(!popularChart.avatar) {
          popularChart.avatar = '/images/logo.png'
        }
        return popularChart;
      })
    }).catch((error)=>{
      popularityItems.value = [
        {
            "name": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "avatar": '/images/logo.png',
            "nftList": [
                {
                    "id": 139,
                    "address": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
                    "tokenId": "1004",
                    "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
                    "mintTime": 1747619219,
                    "name": "Emily Olsen",
                    "exp": 0,
                    "level": 110,
                    "gender": 0,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 372
                },
                {
                    "id": 141,
                    "address": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
                    "tokenId": "1006",
                    "imageUrl": "QmRpmsnHSukQ7uih2ofoT89czMaK8VPDkB8MUUTWnGX49f",
                    "mintTime": 1747619237,
                    "name": "Eloane Dumas",
                    "exp": 0,
                    "level": 12,
                    "gender": 1,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 14
                },
                {
                    "id": 154,
                    "address": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
                    "tokenId": "1019",
                    "imageUrl": "QmaRe1UFAQ3ESCKSqWvQTuwj5EBLwmCLUoNix7UTJkxyNi",
                    "mintTime": 1747619309,
                    "name": "Eva Silveira",
                    "exp": 0,
                    "level": 19,
                    "gender": 0,
                    "breedType": "Turtle",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 18
                },
                {
                    "id": 155,
                    "address": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
                    "tokenId": "1020",
                    "imageUrl": "QmetJMbVsgU8Vh4s1ySMCbZr87vCzuuos8ERh6HeJEHqP3",
                    "mintTime": 1747619319,
                    "name": "Kenan Kulaksızoğlu",
                    "exp": 0,
                    "level": 19,
                    "gender": 0,
                    "breedType": "Turtle",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 18
                }
            ],
            "items": 7
        },
        {
            "name": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "avatar": '/images/logo.png',
            "nftList": [
                {
                    "id": 136,
                    "address": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
                    "tokenId": "1001",
                    "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
                    "mintTime": 1747619199,
                    "name": "Önal Sezek",
                    "exp": 0,
                    "level": 116,
                    "gender": 1,
                    "breedType": "Mauremys sinensis",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 454
                },
                {
                    "id": 147,
                    "address": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
                    "tokenId": "1012",
                    "imageUrl": "Qmec8DnbhbokY9RkmeUHBhwyT5rMkUJgRyrN9Xs7cixWAB",
                    "mintTime": 1747619269,
                    "name": "Guilherme da Costa",
                    "exp": 0,
                    "level": 12,
                    "gender": 1,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 14
                },
                {
                    "id": 152,
                    "address": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
                    "tokenId": "1017",
                    "imageUrl": "QmRz2SHw6YwjBT3zfLd2MbQ9i8oEeB7f62uNMJV13wAcwb",
                    "mintTime": 1747619297,
                    "name": "Budimil Kraynichenko",
                    "exp": 0,
                    "level": 10,
                    "gender": 1,
                    "breedType": "Cat",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 13
                },
                {
                    "id": 159,
                    "address": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
                    "tokenId": "1024",
                    "imageUrl": "QmZwqG32nZZTskKUNQm5jyod9evBoUq6T2PDqb758EThYB",
                    "mintTime": 1747619341,
                    "name": "Macit Tokatlıoğlu",
                    "exp": 0,
                    "level": 89,
                    "gender": 1,
                    "breedType": "Trachemys scripta elegans",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 186
                }
            ],
            "items": 6
        },
        {
            "name": "0x9c134adc6587731460e3868201149414cb2e8008",
            "avatar": '/images/logo.png',
            "nftList": [
                {
                    "id": 142,
                    "address": "0x9c134adc6587731460e3868201149414cb2e8008",
                    "tokenId": "1007",
                    "imageUrl": "QmZxC9uK9zYx5Lkvs4vV9KSFMv6j3qidW1s2h9o14jKZUS",
                    "mintTime": 1747619245,
                    "name": "Annabelle Knight",
                    "exp": 0,
                    "level": 11,
                    "gender": 0,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 14
                },
                {
                    "id": 146,
                    "address": "0x9c134adc6587731460e3868201149414cb2e8008",
                    "tokenId": "1011",
                    "imageUrl": "QmW8QRhiLZeb5jH62oN3AvB7iaPQDnwzhJwzqVrZWvSvnP",
                    "mintTime": 1747619265,
                    "name": "Sophia Wilson",
                    "exp": 0,
                    "level": 14,
                    "gender": 0,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 15
                },
                {
                    "id": 151,
                    "address": "0x9c134adc6587731460e3868201149414cb2e8008",
                    "tokenId": "1016",
                    "imageUrl": "QmNbHCVGEAbVBVF6Z5SEsmLg6D6JfSDTuxLdoytxF2ftPq",
                    "mintTime": 1747619289,
                    "name": "Jaime Villa",
                    "exp": 0,
                    "level": 14,
                    "gender": 0,
                    "breedType": "Cat",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 15
                },
                {
                    "id": 161,
                    "address": "0x9c134adc6587731460e3868201149414cb2e8008",
                    "tokenId": "1026",
                    "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
                    "mintTime": 1747619351,
                    "name": "Marcus Andersen",
                    "exp": 0,
                    "level": 105,
                    "gender": 1,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 316
                }
            ],
            "items": 7
        },
        {
            "name": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
            "avatar": "/images/logo.png",
            "nftList": [
                {
                    "id": 138,
                    "address": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
                    "tokenId": "1003",
                    "imageUrl": "QmWThnS8q8t65KcgnQVuDHzwjaAnFVGDmEXTWE18dGeUzf",
                    "mintTime": 1747619215,
                    "name": "Ekaterina Mercier",
                    "exp": 0,
                    "level": 40,
                    "gender": 1,
                    "breedType": "Graptemys geographica",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 37
                },
                {
                    "id": 145,
                    "address": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
                    "tokenId": "1010",
                    "imageUrl": "QmWtvVtgpSuk1SQbd5was2ra4KPKH5gEPsKC52Tz7rVjV1",
                    "mintTime": 1747619261,
                    "name": "Alexander Montgomery",
                    "exp": 0,
                    "level": 18,
                    "gender": 0,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 18
                },
                {
                    "id": 157,
                    "address": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
                    "tokenId": "1022",
                    "imageUrl": "QmNUba3LFaEm8FbJjqtxmoPewGogEsH9xrfLLURadiCyjF",
                    "mintTime": 1747619329,
                    "name": "Chinese Pond Turtle",
                    "exp": 0,
                    "level": 97,
                    "gender": 0,
                    "breedType": "Mauremys reevesii",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 243
                },
                {
                    "id": 163,
                    "address": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
                    "tokenId": "1028",
                    "imageUrl": "QmRpmsnHSukQ7uih2ofoT89czMaK8VPDkB8MUUTWnGX49f",
                    "mintTime": 1747619367,
                    "name": "Jasmina Spasić",
                    "exp": 0,
                    "level": 18,
                    "gender": 0,
                    "breedType": "Dog",
                    "isAdopt": 0,
                    "isFostered": 1,
                    "isListed": 1,
                    "status": 0,
                    "requiredExp": 18
                }
            ],
            "items": 4
        }
    ]
    })
  } catch (error) {
    console.error(error);
  }finally{
    // loadingStore.hideLoading()
  }

})

</script>

<style lang="scss" scoped>
.home {
  padding: 0 0 2rem;
  background: var(--mt-bg);
  min-height: 100vh;
  color: var(--mt-text);
}

.banner-swiper {
  height: auto;
  margin-bottom: 2rem;
  overflow: hidden;

  :deep(.van-swipe-item) {
    width: 100%;
  }

  .banner-item {
    width: 100%;
    
    img {
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
    }
  }

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
}

.section {
  padding: 0 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    @media (max-width: 768px) {
      margin-bottom: 1rem;
    }

    h2 {
      color: var(--mt-text);
      margin: 0;
      font-size: 1.5rem;

      @media (max-width: 768px) {
        font-size: 1.2rem;
      }
    }

    .view-all-btn {
      height: 32px !important;
      padding: 0 1.2rem !important;
      border-radius: 16px !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      letter-spacing: 0.5px;
      border: none !important;
      background: linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease !important;
      -webkit-tap-highlight-color: transparent;
      color: var(--mt-bg) !important;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        background: linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%) !important;
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      @media (max-width: 768px) {
        height: 28px !important;
        padding: 0 1rem !important;
        font-size: 0.8rem !important;
        
        &.active {
          transform: scale(0.95);
          opacity: 0.8;
          transition: all 0.1s ease;
        }
      }
    }
  }
}

.popular-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  .item-card {
    background: var(--mt-bg-secondary);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .item-info {
      padding: 1rem;

      .creator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .likes {
          margin-left: auto;
          color: var(--mt-primary);
        }
      }

      h3 {
        margin: 0 0 0.5rem;
        color: var(--mt-text);
      }

      .price {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        span {
          color: var(--mt-text-secondary);
        }

        strong {
          color: var(--mt-primary);
        }
      }
    }
  }
}

.ranking-list {
  background: var(--mt-bg-secondary);
  border-radius: 12px;
  overflow: hidden;

  .ranking-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: color-mix(in srgb, var(--mt-primary) 8%, var(--mt-bg));
    border-bottom: 1px solid var(--mt-border);
    font-weight: 600;
    color: var(--mt-text);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);

    .rank {
      width: 50px;
      text-align: center;
      color: var(--mt-primary);
    }

    .info {
      flex: 1;
      margin-left: 1rem;
      color: var(--mt-text);
    }

    .level {
      width: 60px;
      text-align: right;
      color: var(--mt-primary);
    }
  }

  .ranking-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--mt-border);

    &:last-child {
      border-bottom: none;
    }

    .rank {
      width: 50px;
      color: var(--mt-primary);
      font-weight: bold;
      text-align: center;
    }

    .info {
      flex: 1;
      display: flex;
      align-items: center;
      margin-left: 1rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 1rem;
      }

      .name-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .name {
          color: var(--mt-text);
          font-weight: 500;
        }

        .breed-type {
          color: var(--mt-text-secondary);
          font-size: 0.85rem;
        }
      }
    }

    .level {
      width: 60px;
      text-align: right;
      color: var(--mt-primary);
    }
  }
}

.popularity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  .popularity-card {
    background: var(--mt-bg-secondary);
    border-radius: 12px;
    overflow: hidden;
    padding: 1rem;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .images {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;

      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 8px;
      }
    }

    .info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .user {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
      }

      .items {
        color: var(--mt-text-secondary);
        font-size: 0.9rem;
      }
    }
  }
}

.view-more {
  text-align: center;

  .van-button {
    height: 32px !important;
    padding: 0 1.2rem !important;
    border-radius: 16px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    letter-spacing: 0.5px;
    border: none !important;
    background: linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease !important;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%) !important;
    }

    @media (max-width: 768px) {
      height: 28px !important;
      padding: 0 1rem !important;
      font-size: 0.8rem !important;
    }
  }
}
</style>