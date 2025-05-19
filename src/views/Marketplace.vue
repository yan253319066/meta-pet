<template>
  <div class="marketplace">
    <div class="header">
      <div class="search-section">
        <van-search
          v-model="searchAddress"
          :placeholder="t('marketplace.searchPlaceholder')"
          shape="round"
          background="transparent"
          show-action
          @search="handleSearch"
        >
          <template #action>
            <div @click="handleSearch">{{ t('marketplace.search') }}</div>
          </template>
        </van-search>
        <!-- <div class="filter-dropdown">
          <van-dropdown-menu>
            <van-dropdown-item v-model="selectedBreedType" :options="breedTypeOptions" />
          </van-dropdown-menu>
        </div> -->
        <van-icon 
          name="clock-o" 
          class="history-icon" 
          @click="showHistory = true"
        />
      </div>
    </div>

    <div class="nft-list">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :loading-text="loading ? t('marketplace.loading') : ''"
        :finished-text="t('marketplace.noMore')"
        offset="50"
        @load="loadNFTs"
      >
        <!-- <template v-if="nftList.length > 0"> -->
          <div class="nft-grid">
            <div 
              v-for="(nft, index) in nftList" 
              :key="index" 
              class="nft-card"
              @click="handleNFTClick(nft)"
            >
              <div class="nft-image-container">
                <img :src="formatUrl(nft.imageUrl)" :alt="nft.name" class="nft-image" />
                <div class="nft-overlay">
                  <div class="nft-name">{{ nft.name }}</div>
                  <div class="nft-level">Lv.{{ nft.level }}</div>
                  <div class="price-tag">
                    <span class="price-value">{{ nft.price }} {{ nft.payment === '0' ? 'ETH' : 'USDC' }}</span>
                  </div>
                </div>
              </div>
              <div class="nft-info">
                <van-button 
                  type="primary" 
                  size="small" 
                  class="buy-btn"
                  @click.stop="handleBuy(nft)"
                >
                  {{ t('marketplace.buyNow') }}
                </van-button>
              </div>
            </div>
          </div>
        <!-- </template> -->
        <!-- <EmptyState
          v-else
          image="search"
          :description="t('marketplace.noNFTList')"
        /> -->
      </van-list>
    </div>

    <!-- NFT详情弹窗 -->
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

    <!-- 收货信息弹窗 -->
    <DeliveryPopup
      v-model:show="showDeliveryPopup"
      @success="handleDeliverySuccess"
    />

    <!-- 交易历史弹窗 -->
    <van-popup
      v-model:show="showHistory"
      position="right"
      :style="{ width: '100%', height: '100%' }"
    >
      <div class="history-page">
        <div class="history-header">
          <h3>{{ t('marketplace.transactionHistory') }}</h3>
          <van-icon name="cross" class="close-icon" @click="showHistory = false" />
        </div>
        
        <div class="transaction-list">
          <template v-if="completedTransactions.length > 0">
            <div v-for="(tx, index) in completedTransactions" :key="index" class="transaction-card">
              <div class="transaction-header">
                <span class="status">{{ t('marketplace.completed') }}</span>
                <span class="date">{{ formatDate(tx.purchasedTime) }}</span>
              </div>
              <div class="transaction-info">
                <div class="info-item">
                  <span class="label">{{ t('marketplace.tokenId') }}</span>
                  <span class="value">{{ tx.tokenId }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ t('marketplace.price') }}</span>
                  <span class="value">{{ tx.price }} {{ tx.payment === '0' ? 'ETH' : 'USDC' }}</span>
                </div>
                <div class="info-item-address">
                  <span class="label">{{ t('marketplace.buyer') }}</span>
                  <span class="value">{{ (tx.buyer) }}</span>
                </div>
                <div class="info-item-address">
                  <span class="label">{{ t('marketplace.seller') }}</span>
                  <span class="value">{{ (tx.seller) }}</span>
                </div>
              </div>
            </div>
          </template>
          <EmptyState
            v-else
            image="search"
            :description="t('marketplace.noTransactionHistory')"
          />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { showToast } from 'vant'
import request from '@/utils/request'
import { buyNftByEth, buyNftByUsdc,getBalance,getUsdcBalance } from '@/services/wallet'
import MarketplaceNFTDetail from '@/components/MarketplaceNFTDetail.vue'
import DeliveryPopup from '@/components/DeliveryPopup.vue'
import { formatDate, formatAddress, formatUrl } from '@/utils/util'
import { useLoadingStore } from '@/store/loadingStore'
import EmptyState from '@/components/EmptyState.vue'
import { appKit } from '@/config/appKit'
import {store} from '@/store/appkitStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const searchAddress = ref('')
const selectedBreedType = ref('')
const historyTab = ref(0)
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = ref(50)
const nftList = ref([])
const activeTransactions = ref([])
const completedTransactions = ref([])
const showNFTDetail = ref(false)
const showDeliveryPopup = ref(false)
const showHistory = ref(false)
const selectedNFT = ref(null)
const allowLoad = ref(false)

const loadingStore = useLoadingStore()

const breedTypeOptions = [
  { text: t('marketplace.all'), value: '' },
  { text: t('marketplace.common'), value: '1' },
  { text: t('marketplace.rare'), value: '2' },
  { text: t('marketplace.legendary'), value: '3' }
]

const formatStatus = (status) => {
  if(status == 0) return t('marketplace.pending')
  else if(status == 1) return t('marketplace.shipping')
  else if(status == 2) return t('marketplace.completed')
}

const handleSearch = () => {
  pageNum.value = 1
  finished.value = false
  // nftList.value = []
  loadNFTs()
}

const loadNFTs = async () => {
  try {
    loadingStore.showLoading(t('marketplace.loadingNFTList'))
    const res = await request.get('/market/listed', {
      params: {
        pageSize: pageSize.value,
        pageNum: pageNum.value,
        seller: searchAddress.value,
        breedType: selectedBreedType.value
      }
    })

    if (pageNum.value === 1) {
      nftList.value = res.rows
    } else {
      nftList.value = [...nftList.value, ...res.rows]
    }
    
    if (res.rows.length < pageSize.value) {
      finished.value = true
    } else if (loading.value) {
      pageNum.value++
    }

  } catch (error) {
    // console.error(t('marketplace.getNFTListFailed'), error)
    // showToast(t('marketplace.getNFTListFailed'))
    finished.value = true
    nftList.value = [
        {
            "id": 144,
            "txHash": "0x41f2055053c2ed0fa090160c6dde81b38e34d287e1e3c3b485cb8d64abb7dd01",
            "eventName": "Listed",
            "blockNumber": 30415370,
            "tokenId": "1043",
            "imageUrl": "QmeLrRCAz9cQnst7ZX3UHub7CsNBcaA2iFh14tEAg8h9iY",
            "metaJsonUrl": "QmWaKJ28uTT3kikxQVpVUT8hrdDx2jfa1X2BYsjw5FvuY5",
            "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "buyer": null,
            "price": "0.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747620087,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619481,
            "name": "Melvin Sørli",
            "exp": 0,
            "level": 20,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Turtle",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 19
        },
        {
            "id": 143,
            "txHash": "0x2e07aae8a443f0777d954c33ab45eab2d91b47023a5accda6ca74d13d0ae7687",
            "eventName": "Listed",
            "blockNumber": 30415361,
            "tokenId": "1042",
            "imageUrl": "QmetJMbVsgU8Vh4s1ySMCbZr87vCzuuos8ERh6HeJEHqP3",
            "metaJsonUrl": "QmT9BVGftKHh5GNs9uMA1m9wLDBMdHLoD9rNoMCSppn67x",
            "seller": "0x3bb64864c3ac1478c4c7771c0f9044a84106a177",
            "buyer": null,
            "price": "0.5",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747620069,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619477,
            "name": "Mathys Rey",
            "exp": 0,
            "level": 13,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Turtle",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 15
        },
        {
            "id": 142,
            "txHash": "0x4e1de5727071f49502f085b88d5dbcf8139ff2f0758c7b555de01f02accddf76",
            "eventName": "Listed",
            "blockNumber": 30415352,
            "tokenId": "1041",
            "imageUrl": "QmaRe1UFAQ3ESCKSqWvQTuwj5EBLwmCLUoNix7UTJkxyNi",
            "metaJsonUrl": "QmWU1qBFjjhLBjLeWRK6Kg2ckjMtq3NRTafkWpHpYwiy15",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "0.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747620051,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619469,
            "name": "Ronja Linna",
            "exp": 0,
            "level": 20,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Turtle",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 19
        },
        {
            "id": 141,
            "txHash": "0x3f8b91e47bfac39250636c6cabed0134e886da9776832c380decfd4b97ae888f",
            "eventName": "Listed",
            "blockNumber": 30415344,
            "tokenId": "1040",
            "imageUrl": "QmWHX95UbHAgV4WByQVPT7V8xFqe3N1vKUQJ7kpu34N6nv",
            "metaJsonUrl": "QmQXjr3VqmeqVME1Zj5aZGzTtdxe6unxN4EV9atGqjy4fU",
            "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "buyer": null,
            "price": "1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747620035,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619461,
            "name": "Ömür Özkök",
            "exp": 0,
            "level": 10,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 13
        },
        {
            "id": 140,
            "txHash": "0xec9a76d4cdc0537c64852faa7fbbcd543eb4d96c567368939678e2b9703ded0d",
            "eventName": "Listed",
            "blockNumber": 30415335,
            "tokenId": "1039",
            "imageUrl": "QmRz2SHw6YwjBT3zfLd2MbQ9i8oEeB7f62uNMJV13wAcwb",
            "metaJsonUrl": "QmfCk9Fdcftydq6E2HbqqVbTUnxEMbQzyZSyMYvRjKaZB2",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "0.9",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747620017,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619453,
            "name": "Travis Reynolds",
            "exp": 0,
            "level": 10,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 13
        },
        {
            "id": 139,
            "txHash": "0x6fe079458e360de414b95dc33471e02ec999afd60de47fb494e7d639d96cc372",
            "eventName": "Listed",
            "blockNumber": 30415326,
            "tokenId": "1038",
            "imageUrl": "QmNbHCVGEAbVBVF6Z5SEsmLg6D6JfSDTuxLdoytxF2ftPq",
            "metaJsonUrl": "QmQN4qDVDxiiq7ksJWyPnzTSNHwiTjMGisbXfvQRntNwYk",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "0.4",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619999,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619443,
            "name": "Prathiksha Vernekar",
            "exp": 0,
            "level": 15,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 16
        },
        {
            "id": 138,
            "txHash": "0x4ce90caeb9cb27ab24de29c83df6d972e5c70199a4960e6c1df788a937a1e771",
            "eventName": "Listed",
            "blockNumber": 30415317,
            "tokenId": "1037",
            "imageUrl": "Qmen5RtJXAPQEgbXusjhEx1zJ7Ebw2ty3fnKnRYtmb6nfw",
            "metaJsonUrl": "QmTJNXowj5vxpnbp54drfq9QbiYdWu5UpF2HT7waNE1izC",
            "seller": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "buyer": null,
            "price": "0.8",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619981,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619435,
            "name": "Rosa Turner",
            "exp": 0,
            "level": 12,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 137,
            "txHash": "0x7f401bccf0d5365cca137dd9626b18d0f227df3c3262a68874a5dc56bc69421e",
            "eventName": "Listed",
            "blockNumber": 30415309,
            "tokenId": "1036",
            "imageUrl": "QmQJWbrXMUBYe1vNQpyUwFjahWSSxa1kdmurzh1zEYfMCz",
            "metaJsonUrl": "QmZJymXjtJ1U7swpuv6KVyMNoxXBQ6sLKS6AXVYnkQgxQr",
            "seller": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "buyer": null,
            "price": "0.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619965,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619427,
            "name": "Marc Snyder",
            "exp": 0,
            "level": 13,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 15
        },
        {
            "id": 136,
            "txHash": "0x8ab5a415cb313c525d12c684629c242a45f423832e670defb57a11cdcfcfd650",
            "eventName": "Listed",
            "blockNumber": 30415302,
            "tokenId": "1035",
            "imageUrl": "QmNvRbQj6d1AJAvRWEqDcaXBngGHjtdMoRCJAagyUehYCc",
            "metaJsonUrl": "QmSsCabUDLEtwRKnBVuwmWVRdxGovwufZJnxsfkuC9pFHC",
            "seller": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "buyer": null,
            "price": "0.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619951,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619417,
            "name": "Mads Sørensen",
            "exp": 0,
            "level": 19,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 135,
            "txHash": "0x18f7a914b760ff44394e3a95a6e4ff1d7831d340f4a7859b870e2c3aebcd79cf",
            "eventName": "Listed",
            "blockNumber": 30415295,
            "tokenId": "1034",
            "imageUrl": "Qmec8DnbhbokY9RkmeUHBhwyT5rMkUJgRyrN9Xs7cixWAB",
            "metaJsonUrl": "QmUu6eegtSEZX8GGSqjgXGwkEMHFGahw2apynQqA9K9t41",
            "seller": "0xc51b8800dcb34784ed01ba0832e4ded4fe897206",
            "buyer": null,
            "price": "10",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619937,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619413,
            "name": "Tracy Franklin",
            "exp": 0,
            "level": 12,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 134,
            "txHash": "0x4049c3282510806bb7e9e0341fac0c3ffff49c0e52c2c54097d27f610e34c776",
            "eventName": "Listed",
            "blockNumber": 30415287,
            "tokenId": "1033",
            "imageUrl": "QmW8QRhiLZeb5jH62oN3AvB7iaPQDnwzhJwzqVrZWvSvnP",
            "metaJsonUrl": "QmVY4oGLzPv1JeBDRLpJM8oJUf1hkLsoF5svAeFwjDwgbL",
            "seller": "0xc51b8800dcb34784ed01ba0832e4ded4fe897206",
            "buyer": null,
            "price": "1.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619921,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619409,
            "name": "Onni Niska",
            "exp": 0,
            "level": 10,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 13
        },
        {
            "id": 133,
            "txHash": "0xc2719c21a1bb625246fe6d3a1a18a14016b0f614b5737aeea54116f2c3db20a0",
            "eventName": "Listed",
            "blockNumber": 30415280,
            "tokenId": "1032",
            "imageUrl": "QmWtvVtgpSuk1SQbd5was2ra4KPKH5gEPsKC52Tz7rVjV1",
            "metaJsonUrl": "QmQzpu5PhF6Y6Gag6kzSaLH95pjUNMSRM1G6EF4fnHrC5F",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619907,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619401,
            "name": "Drishti Gamskar",
            "exp": 0,
            "level": 13,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 15
        },
        {
            "id": 132,
            "txHash": "0x422ec304e9e819bb4c7bbb50feed7eeaf2b42f63c2753449dc538cacfe47eaff",
            "eventName": "Listed",
            "blockNumber": 30415274,
            "tokenId": "1031",
            "imageUrl": "QmV5dwjEYL43hdDZwPsxVad6VeGaohyBpXntXcfBzQGrUv",
            "metaJsonUrl": "QmRGwtMk7na56KnbiT4s5NmGNcHduXR7Btc4W1n1f2Eb7j",
            "seller": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "buyer": null,
            "price": "1.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619895,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619393,
            "name": "Seline Ree",
            "exp": 0,
            "level": 10,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 13
        },
        {
            "id": 131,
            "txHash": "0xf2665c64feec0f5fb80d6d8e3c3ce216ee0c4490cf842103e05c81932cabd067",
            "eventName": "Listed",
            "blockNumber": 30415267,
            "tokenId": "1030",
            "imageUrl": "QmVjD7LNsuFPwWugiAWNN5MvQSdxDth85y7fuwxtZ8mMKb",
            "metaJsonUrl": "QmQ9SGNiAGx8AY5YjCdvjZxDX3DC27v2XzKdJzRCQBnJc6",
            "seller": "0x3c1b6a5ad72aec89c6262545e0c0f4a7ba781a03",
            "buyer": null,
            "price": "0.8",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619881,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619385,
            "name": "Ella Lammi",
            "exp": 0,
            "level": 28,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 25
        },
        {
            "id": 130,
            "txHash": "0x1ccb4ce85a3fc89c564fa4a770f7071463e2bfc827c6248eff69ecaf9a85f12d",
            "eventName": "Listed",
            "blockNumber": 30415261,
            "tokenId": "1029",
            "imageUrl": "QmZxC9uK9zYx5Lkvs4vV9KSFMv6j3qidW1s2h9o14jKZUS",
            "metaJsonUrl": "Qmav3a1MtEoZBMqbRdSA8bJjKppww9QW8mhwa6qqijxELJ",
            "seller": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "buyer": null,
            "price": "1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619869,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619377,
            "name": "Elly Holand",
            "exp": 0,
            "level": 32,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 28
        },
        {
            "id": 129,
            "txHash": "0xfff302616f446b3d1d6030519dba1cb1470a516e9e492262c11adea460d5d738",
            "eventName": "Listed",
            "blockNumber": 30415252,
            "tokenId": "1028",
            "imageUrl": "QmRpmsnHSukQ7uih2ofoT89czMaK8VPDkB8MUUTWnGX49f",
            "metaJsonUrl": "QmVca7QS8pdM9CFsErkgQCi5rMfqQ63jrVKn4ESVVENf6A",
            "seller": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
            "buyer": null,
            "price": "0.5",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619851,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619367,
            "name": "Jasmina Spasić",
            "exp": 0,
            "level": 18,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 128,
            "txHash": "0x588c7893a89b6ce1112e01b6cf159855110ce69c7f6f0770ddaf23036a71e182",
            "eventName": "Listed",
            "blockNumber": 30415245,
            "tokenId": "1027",
            "imageUrl": "QmZkbijAtEp8dvfVMUYnSGRUS4jYCfH7NPfCFU5xPW87Pf",
            "metaJsonUrl": "QmamYcexFsZNx74juv8mhgXcAsVGwgG1M6wfgSBUrGuzFd",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "0.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619837,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619361,
            "name": "Boyko Stogniy",
            "exp": 0,
            "level": 70,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 100
        },
        {
            "id": 127,
            "txHash": "0x1543aaa4845a93ae5ab0586927816be385fc0de27ac380e2b8f5b8824cbfff6c",
            "eventName": "Listed",
            "blockNumber": 30415241,
            "tokenId": "1026",
            "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
            "metaJsonUrl": "QmVnKGADKFCMnAAWRLKE2KSkCTUFyejKZex4Eysgb168tZ",
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
        },
        {
            "id": 126,
            "txHash": "0xf6af8ce924ee03db7b99bde9972cd7da4e168541b234039dd882f61dbcd93642",
            "eventName": "Listed",
            "blockNumber": 30415237,
            "tokenId": "1025",
            "imageUrl": "QmWThnS8q8t65KcgnQVuDHzwjaAnFVGDmEXTWE18dGeUzf",
            "metaJsonUrl": "QmcL6gnvNgGVKhmdxcoeLGYqTwLoWWSPjDkNmyE9dgPQcb",
            "seller": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "buyer": null,
            "price": "0.0002",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619821,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619345,
            "name": "Esma Ozansoy",
            "exp": 0,
            "level": 93,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Graptemys geographica",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 213
        },
        {
            "id": 125,
            "txHash": "0xbcc0c65746ad63ad7158c9e0c70c266bd385fd017cf00bbc4c69862a09c69984",
            "eventName": "Listed",
            "blockNumber": 30415231,
            "tokenId": "1024",
            "imageUrl": "QmZwqG32nZZTskKUNQm5jyod9evBoUq6T2PDqb758EThYB",
            "metaJsonUrl": "QmZEdwzKRE2eZHAqx1eL6A6Fc6vXTKhEA3bmi5oEC9qoY4",
            "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "buyer": null,
            "price": "0.0001",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619809,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619341,
            "name": "Macit Tokatlıoğlu",
            "exp": 0,
            "level": 89,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Trachemys scripta elegans",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 186
        },{
            "id": 124,
            "txHash": "0xfba08d1f7e2691c8f8cb330c746e140207298fbfbf08f550beeb6bab6eadedc6",
            "eventName": "Listed",
            "blockNumber": 30415224,
            "tokenId": "1023",
            "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
            "metaJsonUrl": "QmNVNiAMRwK2MA58aTsTQ6xxLfswsZBw2sXxv8t2cJUyWK",
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
            "id": 123,
            "txHash": "0x2d3e2fbe55bcf963050e058111cb3707ff6bb9f1e20c82b6050d56134f8b419c",
            "eventName": "Listed",
            "blockNumber": 30415218,
            "tokenId": "1022",
            "imageUrl": "QmNUba3LFaEm8FbJjqtxmoPewGogEsH9xrfLLURadiCyjF",
            "metaJsonUrl": "QmbSjSCVC3u2KWRPwsm9vYXMaLy6NgMDYimgrqrnqiHkou",
            "seller": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
            "buyer": null,
            "price": "0.0001",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619783,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619329,
            "name": "Chinese Pond Turtle",
            "exp": 0,
            "level": 97,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Mauremys reevesii",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 243
        },
        {
            "id": 122,
            "txHash": "0x545af66ca01219e3262728d82514c0d21a62fffc464e8cecbf5f918b807d2329",
            "eventName": "Listed",
            "blockNumber": 30415211,
            "tokenId": "1021",
            "imageUrl": "QmeLrRCAz9cQnst7ZX3UHub7CsNBcaA2iFh14tEAg8h9iY",
            "metaJsonUrl": "QmWaKJ28uTT3kikxQVpVUT8hrdDx2jfa1X2BYsjw5FvuY5",
            "seller": "0x3bb64864c3ac1478c4c7771c0f9044a84106a177",
            "buyer": null,
            "price": "0.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619769,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619325,
            "name": "Philip Ramfjord",
            "exp": 0,
            "level": 12,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Turtle",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 121,
            "txHash": "0xdb82eb8f1b714275e888f6f8eea16e42ddd2c868b2be6b9ced59b37f7dbd4752",
            "eventName": "Listed",
            "blockNumber": 30415207,
            "tokenId": "1020",
            "imageUrl": "QmetJMbVsgU8Vh4s1ySMCbZr87vCzuuos8ERh6HeJEHqP3",
            "metaJsonUrl": "QmT9BVGftKHh5GNs9uMA1m9wLDBMdHLoD9rNoMCSppn67x",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "0.5",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619761,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619319,
            "name": "Kenan Kulaksızoğlu",
            "exp": 0,
            "level": 19,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Turtle",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 120,
            "txHash": "0x229986538ecd91e3a51bfa96a13209274a58326c51d475f9cc73b197c715d269",
            "eventName": "Listed",
            "blockNumber": 30415203,
            "tokenId": "1019",
            "imageUrl": "QmaRe1UFAQ3ESCKSqWvQTuwj5EBLwmCLUoNix7UTJkxyNi",
            "metaJsonUrl": "QmWU1qBFjjhLBjLeWRK6Kg2ckjMtq3NRTafkWpHpYwiy15",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "0.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619753,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619309,
            "name": "Eva Silveira",
            "exp": 0,
            "level": 19,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Turtle",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 119,
            "txHash": "0x2a0e47efd7e4facc05d1c6f045621e7d8bab30f2ea492fe5673dced75ec0044a",
            "eventName": "Listed",
            "blockNumber": 30415196,
            "tokenId": "1018",
            "imageUrl": "QmWHX95UbHAgV4WByQVPT7V8xFqe3N1vKUQJ7kpu34N6nv",
            "metaJsonUrl": "QmQXjr3VqmeqVME1Zj5aZGzTtdxe6unxN4EV9atGqjy4fU",
            "seller": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "buyer": null,
            "price": "1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619739,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619301,
            "name": "Ruby Lewis",
            "exp": 0,
            "level": 12,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 118,
            "txHash": "0x9b4008b2a61a6f1da5322309890e4b652cf8c0226849929737d5b73e6b24117d",
            "eventName": "Listed",
            "blockNumber": 30415188,
            "tokenId": "1017",
            "imageUrl": "QmRz2SHw6YwjBT3zfLd2MbQ9i8oEeB7f62uNMJV13wAcwb",
            "metaJsonUrl": "QmfCk9Fdcftydq6E2HbqqVbTUnxEMbQzyZSyMYvRjKaZB2",
            "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "buyer": null,
            "price": "0.9",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619723,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619297,
            "name": "Budimil Kraynichenko",
            "exp": 0,
            "level": 10,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 13
        },
        {
            "id": 117,
            "txHash": "0x80de9392239ef9272c4bf963f724ee7feb79a2172f4a315124f2136c3d7bae70",
            "eventName": "Listed",
            "blockNumber": 30415181,
            "tokenId": "1016",
            "imageUrl": "QmNbHCVGEAbVBVF6Z5SEsmLg6D6JfSDTuxLdoytxF2ftPq",
            "metaJsonUrl": "QmQN4qDVDxiiq7ksJWyPnzTSNHwiTjMGisbXfvQRntNwYk",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "0.4",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619709,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619289,
            "name": "Jaime Villa",
            "exp": 0,
            "level": 14,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 15
        },
        {
            "id": 116,
            "txHash": "0x3dd2f2d9b403c674812ee12faba2455d77d434afe79d77f590a70da883a1dd59",
            "eventName": "Listed",
            "blockNumber": 30415174,
            "tokenId": "1015",
            "imageUrl": "Qmen5RtJXAPQEgbXusjhEx1zJ7Ebw2ty3fnKnRYtmb6nfw",
            "metaJsonUrl": "QmTJNXowj5vxpnbp54drfq9QbiYdWu5UpF2HT7waNE1izC",
            "seller": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "buyer": null,
            "price": "0.8",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619695,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619285,
            "name": "Felix Wong",
            "exp": 0,
            "level": 19,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 115,
            "txHash": "0x68503e24b23230d4062e2d00bc5022375df5bf005fddd0b61f69d2f89359e56b",
            "eventName": "Listed",
            "blockNumber": 30415165,
            "tokenId": "1014",
            "imageUrl": "QmQJWbrXMUBYe1vNQpyUwFjahWSSxa1kdmurzh1zEYfMCz",
            "metaJsonUrl": "QmZJymXjtJ1U7swpuv6KVyMNoxXBQ6sLKS6AXVYnkQgxQr",
            "seller": "0xc51b8800dcb34784ed01ba0832e4ded4fe897206",
            "buyer": null,
            "price": "0.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619677,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619277,
            "name": "Lawrence Parker",
            "exp": 0,
            "level": 19,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 114,
            "txHash": "0xdd0a907fea9bc64f57887f9e021947b6afe8b7b5a0e5289a3f370cd5dbbabadf",
            "eventName": "Listed",
            "blockNumber": 30415159,
            "tokenId": "1013",
            "imageUrl": "QmNvRbQj6d1AJAvRWEqDcaXBngGHjtdMoRCJAagyUehYCc",
            "metaJsonUrl": "QmSsCabUDLEtwRKnBVuwmWVRdxGovwufZJnxsfkuC9pFHC",
            "seller": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "buyer": null,
            "price": "0.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619665,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619273,
            "name": "Oscar Smith",
            "exp": 0,
            "level": 18,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Cat",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 113,
            "txHash": "0x2b7172b8c514568ab56eca5d4bc03c0ed57d3035c6338a0dcaefef8d84d7f436",
            "eventName": "Listed",
            "blockNumber": 30415152,
            "tokenId": "1012",
            "imageUrl": "Qmec8DnbhbokY9RkmeUHBhwyT5rMkUJgRyrN9Xs7cixWAB",
            "metaJsonUrl": "QmUu6eegtSEZX8GGSqjgXGwkEMHFGahw2apynQqA9K9t41",
            "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
            "buyer": null,
            "price": "10",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619651,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619269,
            "name": "Guilherme da Costa",
            "exp": 0,
            "level": 12,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 112,
            "txHash": "0x90ce92357dd103bd507a41a540099d3a30ce2d78f392b3b326ad1bffcf5bed31",
            "eventName": "Listed",
            "blockNumber": 30415146,
            "tokenId": "1011",
            "imageUrl": "QmW8QRhiLZeb5jH62oN3AvB7iaPQDnwzhJwzqVrZWvSvnP",
            "metaJsonUrl": "QmVY4oGLzPv1JeBDRLpJM8oJUf1hkLsoF5svAeFwjDwgbL",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "1.1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619639,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619265,
            "name": "Sophia Wilson",
            "exp": 0,
            "level": 14,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 15
        },
        {
            "id": 111,
            "txHash": "0xaf69e2519ed766122192f95b652222ca95efad6d926f6e121d343ca7c2593015",
            "eventName": "Listed",
            "blockNumber": 30415137,
            "tokenId": "1010",
            "imageUrl": "QmWtvVtgpSuk1SQbd5was2ra4KPKH5gEPsKC52Tz7rVjV1",
            "metaJsonUrl": "QmQzpu5PhF6Y6Gag6kzSaLH95pjUNMSRM1G6EF4fnHrC5F",
            "seller": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
            "buyer": null,
            "price": "2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619621,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619261,
            "name": "Alexander Montgomery",
            "exp": 0,
            "level": 18,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 18
        },
        {
            "id": 110,
            "txHash": "0x5134144dd3d853df89db1d5fc648b6371b2b1d0dc8677713baeebf8ccdd8606f",
            "eventName": "Listed",
            "blockNumber": 30415133,
            "tokenId": "1009",
            "imageUrl": "QmV5dwjEYL43hdDZwPsxVad6VeGaohyBpXntXcfBzQGrUv",
            "metaJsonUrl": "QmRGwtMk7na56KnbiT4s5NmGNcHduXR7Btc4W1n1f2Eb7j",
            "seller": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "buyer": null,
            "price": "1.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619613,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619257,
            "name": "Victoria Vidal",
            "exp": 0,
            "level": 11,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 109,
            "txHash": "0x796ea2c88bd5b8028c73740ffbe99a16aabc2da3d2e88d41359843d23a004029",
            "eventName": "Listed",
            "blockNumber": 30415127,
            "tokenId": "1008",
            "imageUrl": "QmVjD7LNsuFPwWugiAWNN5MvQSdxDth85y7fuwxtZ8mMKb",
            "metaJsonUrl": "QmQ9SGNiAGx8AY5YjCdvjZxDX3DC27v2XzKdJzRCQBnJc6",
            "seller": "0x46d0868c0f3c261edd4398b542c34398ef025b39",
            "buyer": null,
            "price": "0.8",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619601,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619249,
            "name": "Nora Bates",
            "exp": 0,
            "level": 17,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 17
        },
        {
            "id": 108,
            "txHash": "0xb46dc499bfa1df2cca493f2b165ad1f9288ef90aac3b062a6cdbe6c21460fdef",
            "eventName": "Listed",
            "blockNumber": 30415119,
            "tokenId": "1007",
            "imageUrl": "QmZxC9uK9zYx5Lkvs4vV9KSFMv6j3qidW1s2h9o14jKZUS",
            "metaJsonUrl": "Qmav3a1MtEoZBMqbRdSA8bJjKppww9QW8mhwa6qqijxELJ",
            "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
            "buyer": null,
            "price": "1",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619585,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619245,
            "name": "Annabelle Knight",
            "exp": 0,
            "level": 11,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 107,
            "txHash": "0x45b478ac1b8f45203cbf30b362cc9276b17f4742697a618d4fd8e0bc954ebcf5",
            "eventName": "Listed",
            "blockNumber": 30415114,
            "tokenId": "1006",
            "imageUrl": "QmRpmsnHSukQ7uih2ofoT89czMaK8VPDkB8MUUTWnGX49f",
            "metaJsonUrl": "QmVca7QS8pdM9CFsErkgQCi5rMfqQ63jrVKn4ESVVENf6A",
            "seller": "0x1bdb44b84d0ac8a7d57c233ae2a004d78f949fff",
            "buyer": null,
            "price": "0.5",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619575,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619237,
            "name": "Eloane Dumas",
            "exp": 0,
            "level": 12,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 14
        },
        {
            "id": 106,
            "txHash": "0x2c6ecf8afad312799c71121a6951c3036a9aa7cb0c42e32f785853b1b9307da9",
            "eventName": "Listed",
            "blockNumber": 30415108,
            "tokenId": "1005",
            "imageUrl": "QmZkbijAtEp8dvfVMUYnSGRUS4jYCfH7NPfCFU5xPW87Pf",
            "metaJsonUrl": "QmamYcexFsZNx74juv8mhgXcAsVGwgG1M6wfgSBUrGuzFd",
            "seller": "0x4d3a3e8d8311ec22e5edb3d1ddc3f783d3373b1b",
            "buyer": null,
            "price": "0.2",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619563,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619229,
            "name": "Simplício Porto",
            "exp": 0,
            "level": 75,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Dog",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 117
        },
        {
            "id": 105,
            "txHash": "0x9e9660884a7773069862941b0a80b68f5a65b90dae82f2e42e715980212b8860",
            "eventName": "Listed",
            "blockNumber": 30415100,
            "tokenId": "1004",
            "imageUrl": "QmVhhM5eCPSVYdUiGXQxoKaBXSEcJxtDMKxj1EZikJLhmV",
            "metaJsonUrl": "QmVnKGADKFCMnAAWRLKE2KSkCTUFyejKZex4Eysgb168tZ",
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
        },{
            "id": 104,
            "txHash": "0x4c0c77ba0b97ef3828c79ca5d469dc12fb1c7f3835114a5d7ebfa9f4eae213a9",
            "eventName": "Listed",
            "blockNumber": 30415093,
            "tokenId": "1003",
            "imageUrl": "QmWThnS8q8t65KcgnQVuDHzwjaAnFVGDmEXTWE18dGeUzf",
            "metaJsonUrl": "QmcL6gnvNgGVKhmdxcoeLGYqTwLoWWSPjDkNmyE9dgPQcb",
            "seller": "0x62c5193cba6fddc62186d4f0bdc86855789309ef",
            "buyer": null,
            "price": "0.0002",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619533,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619215,
            "name": "Ekaterina Mercier",
            "exp": 0,
            "level": 40,
            "totalTasksCompleted": 0,
            "gender": 1,
            "breedType": "Graptemys geographica",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 37
        },
        {
            "id": 103,
            "txHash": "0xaccef1e1b570d591c8c863473ba50d208a7735bebe8b2b39a3c2f0aa4d4753ee",
            "eventName": "Listed",
            "blockNumber": 30415086,
            "tokenId": "1002",
            "imageUrl": "QmZwqG32nZZTskKUNQm5jyod9evBoUq6T2PDqb758EThYB",
            "metaJsonUrl": "QmZEdwzKRE2eZHAqx1eL6A6Fc6vXTKhEA3bmi5oEC9qoY4",
            "seller": "0x3bb64864c3ac1478c4c7771c0f9044a84106a177",
            "buyer": null,
            "price": "0.0001",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619519,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619209,
            "name": "Oliver Kinnunen",
            "exp": 0,
            "level": 50,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Trachemys scripta elegans",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 51
        },
        {
            "id": 102,
            "txHash": "0xaedc1a73c02ca48205303f9db6afb322c37fc33560a4ebf011379d83f4deedd6",
            "eventName": "Listed",
            "blockNumber": 30415080,
            "tokenId": "1001",
            "imageUrl": "QmR8EyTFrYHmQT9cfcYJNwBrbr375NrAp9rFWCQz1cdG3F",
            "metaJsonUrl": "QmNVNiAMRwK2MA58aTsTQ6xxLfswsZBw2sXxv8t2cJUyWK",
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
            "id": 101,
            "txHash": "0x214dbb3c88b0e3ba75ab8fb7f4a07db41c85ee0439405b07265c70e257244507",
            "eventName": "Listed",
            "blockNumber": 30415072,
            "tokenId": "1000",
            "imageUrl": "QmNUba3LFaEm8FbJjqtxmoPewGogEsH9xrfLLURadiCyjF",
            "metaJsonUrl": "QmbSjSCVC3u2KWRPwsm9vYXMaLy6NgMDYimgrqrnqiHkou",
            "seller": "0x5aa0ca5fcc22f8b080916eb494f83c5d97746837",
            "buyer": null,
            "price": "0.0001",
            "payment": "0",
            "fostered": 1,
            "listedTime": 1747619491,
            "purchasedTime": null,
            "deliveryConfirmedTime": null,
            "status": 0,
            "mintTime": 1747619191,
            "name": "Hitesh Dalvi",
            "exp": 0,
            "level": 63,
            "totalTasksCompleted": 0,
            "gender": 0,
            "breedType": "Mauremys reevesii",
            "likeCount": null,
            "shareCount": null,
            "commentCount": null,
            "isAdopt": null,
            "isFostered": null,
            "isListed": null,
            "requiredExp": 79
        }
    ]

  } finally {
    loadingStore.hideLoading()
    loading.value = false
  }
}

const loadTransactions = async () => {
  try {
    loadingStore.showLoading(t('marketplace.loadingTransactions'))
    const completedRes = await request.get('/market/completed')
    completedTransactions.value = completedRes.rows
  } catch (error) {
    console.error(t('marketplace.getTransactionsFailed'), error)
    showToast(t('marketplace.getTransactionsFailed'))
  } finally {
    loadingStore.hideLoading()
  }
}

const handleNFTClick = (nft) => {
  selectedNFT.value = nft
  showNFTDetail.value = true
}

const handleBuy = async (nft) => {
  try {
    if(!localStorage.getItem("meta-token")) return appKit.open()
    let hash = null
  if(nft.payment == 0){
    const ethBalance = await getBalance(store.accountState.address);
    if(ethBalance < nft.price) return showToast(t('marketplace.insufficientBalance'))
      loadingStore.showLoading(t('marketplace.processingPurchase'))
      hash = await buyNftByEth(
        nft.tokenId,
        nft.price
      )
    }
    else {
      const tokenBalance = await getUsdcBalance(store.accountState.address, true)
      if(tokenBalance < nft.price) return showToast(t('marketplace.insufficientBalance'))
      loadingStore.showLoading(t('marketplace.processingPurchase'))
      hash = await buyNftByUsdc(
        nft.tokenId
      )
    }
    
    if (hash) {
      showToast(t('marketplace.purchaseSuccess'))
      showNFTDetail.value = false
      loadNFTs()
      loadTransactions()
    }
  } catch (error) {
    console.error(t('marketplace.purchaseFailed'), error)
    showToast(t('marketplace.purchaseFailed'))
  } finally {
    loadingStore.hideLoading()
  }
}

const handleDeliverySuccess = async (deliveryInfo) => {
  // This function is no longer used as the buy method is simplified
}

const updateTrackingNumber = async (tx) => {
  try {
    await request.post('/transaction/update-tracking', {
      transactionId: tx.id,
      trackingNumber: tx.trackingNumber
    })
    showToast(t('marketplace.updateSuccess'))
  } catch (error) {
    console.error(t('marketplace.updateTrackingFailed'), error)
    showToast(t('marketplace.updateFailed'))
  }
}

// 监听 showHistory 的变化
watch(showHistory, async (newVal) => {
  if (newVal) {
    await loadTransactions()
  }
})

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.marketplace {
  padding: 0 0 2rem;
  background: var(--mt-bg);
  min-height: 100vh;
  color: var(--mt-text);
}

.header {
  background: var(--mt-bg);
  // padding: 1rem 2rem;
  border-bottom: 1px solid var(--mt-border);

  @media (max-width: 768px) {
    padding: 1rem;
  }

  .search-section {
    display: flex;
    align-items: center;
    gap: 1rem;

    :deep(.van-search) {
      flex: 1;
      padding: 0;
      background: transparent;

      .van-search__content {
        background: var(--mt-bg-secondary);
        border-radius: 20px;
      }

      .van-search__action {
        color: var(--mt-primary);
        font-weight: 500;
        padding: 0 0.5rem;
      }
    }

    .history-icon {
      font-size: 1.5rem;
      color: var(--mt-text);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background-color 0.3s;

      &:hover {
        background: var(--mt-bg-secondary);
      }
    }
  }
}

.nft-list {
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  padding: 1rem;

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

      .nft-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 0.5rem;
        background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%);
        color: white;
        display: flex;
        flex-direction: column;

        .nft-name {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .nft-level {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--mt-primary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .price-tag {
          position: absolute;
          bottom: 0.5rem;
          left: 0.5rem;
          right: 0.5rem;
          background: none;
          padding: 0.5rem;
          border-radius: 8px;
          text-align: center;

          .price-value {
            font-size: 1rem;
            font-weight: 600;
            color: var(--mt-primary);
          }
        }
      }
    }

    .nft-info {
      padding: 0.5rem;
      display: flex;
      justify-content: center;

      .buy-btn {
        width: 100%;
        height: 32px;
        border-radius: 16px;
        font-size: 0.9rem;
        font-weight: 500;
        background: var(--mt-primary);
        border-color: var(--mt-primary);
        color: #fff;

        &:active {
          opacity: 0.9;
        }
      }
    }
  }
}

.history-page {
  height: 100%;
  background: var(--mt-bg);
  display: flex;
  flex-direction: column;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--mt-border);

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

  .transaction-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;

  .transaction-card {
    background: var(--mt-bg-secondary);
    border-radius: 12px;
    padding: 1rem;

    .transaction-header {
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

    .transaction-info {
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
        }
      }

      .info-item-address{
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

      .platform-address {
        grid-column: 1 / -1;
        background: var(--mt-bg);
        padding: 1rem;
        border-radius: 8px;
        margin-top: 0.5rem;

        .address-title {
          color: var(--mt-text);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .address-content {
          color: var(--mt-text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1rem;

          p {
            margin: 0.25rem 0;
          }
        }
      }
    }
  }
}
</style> 