<template>
  <van-popup :show="show" @update:show="$emit('update:show', $event)" position="bottom" round>
    <div class="breed-popup">
      <h3>{{ t('components.breed.title') }}</h3>
      <div class="nft-pair">
        <div class="nft-item" :class="{ 'selected': selectedNFT === 'male' }">
          <div class="nft-image">
            <img :src="formatUrl(maleNFT?.imageUrl)" :alt="maleNFT?.name" />
          </div>
          <div class="nft-info">
            <div class="name">{{ maleNFT?.name || t('components.breed.selectMale') }}</div>
            <div class="level">{{ t('components.breed.level') }}: {{ maleNFT?.level || '-' }}</div>
            <div class="gender">{{ t('components.breed.gender') }}: {{ maleNFT?.gender === 1 ? t('components.breed.male') : '-' }}</div>
          </div>
          <van-button 
            v-if="!maleNFT"
            type="primary" 
            size="small"
            @click="selectNFT('male')"
          >
            {{ t('components.breed.select') }}
          </van-button>
          <van-button 
            v-else
            type="danger" 
            size="small"
            @click="clearNFT('male')"
          >
            {{ t('components.breed.cancel') }}
          </van-button>
        </div>
        <div class="pair-symbol">+</div>
        <div class="nft-item" :class="{ 'selected': selectedNFT === 'female' }">
          <div class="nft-image">
            <img :src="formatUrl(femaleNFT?.imageUrl)" :alt="femaleNFT?.name" />
          </div>
          <div class="nft-info">
            <div class="name">{{ femaleNFT?.name || t('components.breed.selectFemale') }}</div>
            <div class="level">{{ t('components.breed.level') }}: {{ femaleNFT?.level || '-' }}</div>
            <div class="gender">{{ t('components.breed.gender') }}: {{ femaleNFT?.gender === 2 ? t('components.breed.female') : '-' }}</div>
          </div>
          <van-button 
            v-if="!femaleNFT"
            type="primary" 
            size="small"
            @click="selectNFT('female')"
          >
            {{ t('components.breed.select') }}
          </van-button>
          <van-button 
            v-else
            type="danger" 
            size="small"
            @click="clearNFT('female')"
          >
            {{ t('components.breed.cancel') }}
          </van-button>
        </div>
      </div>
      <div class="requirements">
        <h4>{{ t('components.breed.requirements') }}</h4>
        <div class="requirement-item" :class="{ 'satisfied': maleNFT?.level >= 100 }">
          <van-icon :name="maleNFT?.level >= 100 ? 'success' : 'cross'" />
          <span>{{ t('components.breed.maleLevelRequirement') }}</span>
        </div>
        <div class="requirement-item" :class="{ 'satisfied': femaleNFT?.level >= 100 }">
          <van-icon :name="femaleNFT?.level >= 100 ? 'success' : 'cross'" />
          <span>{{ t('components.breed.femaleLevelRequirement') }}</span>
        </div>
        <div class="requirement-item" :class="{ 'satisfied': maleNFT?.gender === 1 }">
          <van-icon :name="maleNFT?.gender === 1 ? 'success' : 'cross'" />
          <span>{{ t('components.breed.maleGenderRequirement') }}</span>
        </div>
        <div class="requirement-item" :class="{ 'satisfied': femaleNFT?.gender === 2 }">
          <van-icon :name="femaleNFT?.gender === 2 ? 'success' : 'cross'" />
          <span>{{ t('components.breed.femaleGenderRequirement') }}</span>
        </div>
      </div>
      <div class="action-buttons">
        <van-button 
          block 
          type="primary" 
          :disabled="!canBreed"
          @click="handleBreed"
        >
          {{ t('components.breed.startBreeding') }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { formatUrl } from '@/utils/util'

const { t } = useI18n()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  nfts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:show', 'select', 'breed'])

const maleNFT = ref(null)
const femaleNFT = ref(null)
const selectedNFT = ref(null)

// 监听传入的 NFTs
watch(() => props.nfts, (newNFTs) => {
  if (newNFTs && newNFTs.length > 0) {
    const nft = newNFTs[0]
    if (nft.gender === 1) {
      maleNFT.value = nft
    } else if (nft.gender === 2) {
      femaleNFT.value = nft
    }
  }
}, { immediate: true })

// 计算是否可以繁殖
const canBreed = computed(() => {
  return maleNFT.value && femaleNFT.value &&
    maleNFT.value.level >= 100 &&
    femaleNFT.value.level >= 100 &&
    maleNFT.value.gender === 1 &&
    femaleNFT.value.gender === 2
})

// 选择 NFT
const selectNFT = (type) => {
  selectedNFT.value = type
  emit('select', type)
}

// 清除已选择的 NFT
const clearNFT = (type) => {
  if (type === 'male') {
    maleNFT.value = null
  } else {
    femaleNFT.value = null
  }
}

// 设置选择的 NFT
const setSelectedNFT = (nft) => {
  if (selectedNFT.value === 'male') {
    if (nft.gender !== 1) {
      showToast(t('components.breed.selectMaleNFT'))
      return
    }
    maleNFT.value = nft
  } else {
    if (nft.gender !== 2) {
      showToast(t('components.breed.selectFemaleNFT'))
      return
    }
    femaleNFT.value = nft
  }
  selectedNFT.value = null
}

// 处理繁殖
const handleBreed = () => {
  if (!canBreed.value) {
    showToast(t('components.breed.requirementsNotMet'))
    return
  }
  emit('breed', {
    male: maleNFT.value,
    female: femaleNFT.value
  })
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.breed-popup {
  padding: 1.5rem;

  h3 {
    margin: 0 0 1.5rem;
    text-align: center;
    color: var(--mt-text);
  }

  .nft-pair {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .nft-item {
      flex: 1;
      padding: 1rem;
      background: var(--mt-bg-secondary);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;

      &.selected {
        border: 2px solid var(--mt-primary);
      }

      .nft-image {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--mt-bg);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .nft-info {
        text-align: center;

        .name {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .level, .gender {
          color: var(--mt-text-secondary);
          font-size: 0.9rem;
        }
      }
    }

    .pair-symbol {
      font-size: 1.5rem;
      color: var(--mt-text-secondary);
    }
  }

  .requirements {
    margin-bottom: 1.5rem;

    h4 {
      margin: 0 0 1rem;
      color: var(--mt-text);
      font-size: 1rem;
    }

    .requirement-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--mt-bg-secondary);
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
      }
    }
  }

  .action-buttons {
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