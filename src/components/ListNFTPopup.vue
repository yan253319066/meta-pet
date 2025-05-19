<template>
  <van-popup :show="show" @update:show="$emit('update:show', $event)" position="bottom" round>
    <div class="list-popup">
      <h3>{{ t('components.list.title') }}</h3>
      <div class="form">
        <van-field
          v-model="price"
          type="number"
          :label="t('components.list.price')"
          :placeholder="t('components.list.pricePlaceholder')"
          :rules="[{ required: true, message: t('components.list.priceRequired') }]"
        />
        <van-field
          :model-value="displayTokenType"
          is-link
          readonly
          :label="t('components.list.tokenType')"
          :placeholder="t('components.list.tokenTypePlaceholder')"
          @click="showTokenPicker = true"
        />
      </div>
      <div class="action-buttons">
        <van-button block type="primary" @click="handleList">{{ t('components.list.confirm') }}</van-button>
      </div>
    </div>

    <!-- 代币选择器 -->
    <van-popup v-model:show="showTokenPicker" position="bottom" round>
      <van-picker
        :columns="tokenOptions"
        @confirm="onTokenConfirm"
        @cancel="showTokenPicker = false"
        show-toolbar
        :title="t('components.list.selectTokenType')"
      />
    </van-popup>
  </van-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { listNft, listNFTWithPermit } from '@/services/wallet'
import { useLoadingStore } from '@/store/loadingStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loadingStore = useLoadingStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  nft: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:show', 'success'])

const tokenOptions = [
  { text: 'ETH', value: '0' },
  { text: 'USDC', value: '1' }
]

const price = ref('')
const tokenType = ref('0')
const showTokenPicker = ref(false)

const displayTokenType = computed(() => {
  const option = tokenOptions.find(opt => opt.value === tokenType.value)
  return option ? option.text : ''
})

const onTokenConfirm = ({ selectedValues }) => {
  tokenType.value = selectedValues[0]
  showTokenPicker.value = false
}

const handleList = async () => {
  if (!price.value || !tokenType.value) {
    showToast(t('components.list.fillComplete'))
    return
  }

  try {
    loadingStore.showLoading()
    if(props.nft?.level < 10) return showToast(t('components.list.levelTooLow'))
    if(props.nft?.isListed == 1) return showToast(t('components.list.alreadyListed'))
    if(props.nft?.isFostered == 2) return showToast(t('components.list.selfCareCannotList'))
    const hash = await listNft(props.nft.tokenId, price.value, tokenType.value)
    // const hash = await listNFTWithPermit(props.nft.tokenId, price.value, tokenType.value)
    if (hash) {
      showToast(t('components.list.success'))
      emit('success')
      emit('update:show', false)
    } else {
      showToast(t('components.list.failed'))
    }
  } catch (error) {
    console.error(t('components.list.failed'), error)
    showToast(t('components.list.failed'))
  }finally{
    loadingStore.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.list-popup {
  padding: 1.5rem;

  h3 {
    margin: 0 0 1.5rem;
    text-align: center;
    color: var(--mt-text);
  }

  .form {
    margin-bottom: 1.5rem;
  }

  .action-buttons {
    .van-button {
      background: var(--mt-primary);
      border-color: var(--mt-primary);
    }
  }
}
</style> 