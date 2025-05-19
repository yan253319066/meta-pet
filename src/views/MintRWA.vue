<template>
  <div class="mint-rwa">
    <van-form @submit="onSubmit" class="mint-form">
      <van-cell-group inset>
        <van-field
          v-model="formData.name"
          name="name"
          :label="t('mintRWA.name')"
          :placeholder="t('mintRWA.namePlaceholder')"
          :rules="[{ required: true, message: t('mintRWA.nameRequired') }]"
        />
        
        <van-field
          v-model="formData.description"
          name="description"
          type="textarea"
          rows="3"
          :label="t('mintRWA.description')"
          :placeholder="t('mintRWA.descriptionPlaceholder')"
          :rules="[{ required: true, message: t('mintRWA.descriptionRequired') }]"
          maxlength="200"
          show-word-limit
        />

        <!-- <van-field
          v-model="formData.image"
          name="image"
          :label="t('mintRWA.image')"
          :placeholder="t('mintRWA.imagePlaceholder')"
          :rules="[{ required: true, message: t('mintRWA.imageRequired') }]"
        >
          <template #button>
            <van-uploader
              v-model="fileList"
              :max-count="1"
              :after-read="afterRead"
              :before-read="beforeRead"
            />
          </template>
        </van-field> -->
        <div class="upload-section">
          <div class="upload-label">{{ t('mintRWA.image') }}</div>
          <van-uploader
            v-model="fileList"
            :max-count="1"
            :after-read="afterRead"
            :before-read="beforeRead"
            :rules="[{ required: true, message: t('mintRWA.imageRequired') }]"
          />
          <div class="upload-tip">
            <van-notice-bar
            :text="t('mintRWA.imageTip')"
            left-icon="info-o"
            :color="'var(--mt-primary)'"
            :background="'var(--mt-bg-secondary)'"
            />
          </div>
        </div>

        <van-field
          name="breedType"
          :label="t('mintRWA.breedType')"
          :rules="[{ required: true, message: t('mintRWA.breedTypeRequired') }]"
        >
          <template #input>
            <van-radio-group v-model="formData.breedType" direction="horizontal">
              <van-radio name="Dog">{{ t('mintRWA.dog') }}</van-radio>
              <van-radio name="Cat">{{ t('mintRWA.cat') }}</van-radio>
              <van-radio name="Turtle">{{ t('mintRWA.turtle') }}</van-radio>
              <van-radio name="Fish">{{ t('mintRWA.fish') }}</van-radio>
              <van-radio name="Bird">{{ t('mintRWA.bird') }}</van-radio>
              <van-radio name="Mouse">{{ t('mintRWA.mouse') }}</van-radio>
              <van-radio name="Other">{{ t('mintRWA.other') }}</van-radio>
            </van-radio-group>
          </template>
        </van-field>

        <van-field
          name="gender"
          :label="t('mintRWA.gender')"
          :rules="[{ required: true, message: t('mintRWA.genderRequired') }]"
        >
          <template #input>
            <van-radio-group v-model="formData.gender" direction="horizontal">
              <van-radio name="0">{{ t('mintRWA.male') }}</van-radio>
              <van-radio name="1">{{ t('mintRWA.female') }}</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>

      <div class="submit-btn">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          :color="'var(--mt-primary)'"
        >
          {{ t('mintRWA.submit') }}
        </van-button>
      </div>

      <div class="notice">
        <van-notice-bar
          :text="t('mintRWA.notice')"
          left-icon="info-o"
          :color="'var(--mt-primary)'"
          :background="'var(--mt-bg-secondary)'"
        />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { userMint, mintFeeETH, getBalanceEth } from '@/services/wallet'
import { useLoadingStore } from '@/store/loadingStore'
import request from '@/utils/request'
import { store } from '@/store/appkitStore'

const { t } = useI18n()
const loadingStore = useLoadingStore()
const loading = ref(false)
const fileList = ref([])

const formData = reactive({
  name: '',
  description: '',
  image: null,
  breedType: '',
  gender: ''
})

const beforeRead = (file) => {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/jpg' && file.type !== 'image/webp' && file.type !== 'image/gif' ) {
    showToast(t('mintRWA.imageTypeError'))
    return false
  }
  if (file.size > 1 * 1024 * 1024) {
    showToast(t('mintRWA.imageSizeError'))
    return false
  }
  return true
}

const afterRead = async (file) => {
    formData.image = file.file
//   try {
//     const formData = new FormData()
//     formData.append('file', file.file)
//     const res = await request.post('/upload', formData)
//     formData.image = res.data.url
//   } catch (error) {
//     console.error(t('mintRWA.uploadFailed'), error)
//     showToast(t('mintRWA.uploadFailed'))
//   }
}

const onSubmit = async () => {
  try {
    loading.value = true
    loadingStore.showLoading()

    const submitData = new FormData()
    submitData.append('file', formData.image)
    submitData.append('name', formData.name)
    submitData.append('description', formData.description)
    submitData.append('breedType', formData.breedType)
    submitData.append('gender', formData.gender)

    const res = await request.post('/nft/mint', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const metaCid = res?.data?.metaCid
    if(!metaCid) {
      showToast(t('mintRWA.submitFailed'))
      return
    }
    const fee = await mintFeeETH()
    const ethBalance = await getBalanceEth(store.accountState.address)

    if(ethBalance < fee) return showToast(t('marketplace.insufficientBalance'))
    const hash = await userMint(metaCid, formData.name, formData.breedType, formData.gender, fee)
    if (hash) {
      showToast(t('mintRWA.submitSuccess'))
      // 重置表单
      formData.name = ''
      formData.description = ''
      formData.image = null
      formData.breedType = ''
      formData.gender = ''
      fileList.value = []
    }
  } catch (error) {
    console.error(t('mintRWA.submitFailed'), error)
    showToast(t('mintRWA.submitFailed'))
  } finally {
    loading.value = false
    loadingStore.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.mint-rwa {
  padding: 1rem;
  background: var(--mt-bg);
  min-height: 100vh;

  .mint-form {
    .upload-section {
      margin: 1rem;
    //   padding: 1rem;
    //   background: var(--mt-bg-secondary);
      border-radius: 8px;

      .upload-label {
        margin-bottom: 0.5rem;
        color: var(--mt-text);
        font-size: 14px;
      }

      .upload-tip {
        margin-top: 0.5rem;
        color: var(--mt-text-secondary);
        font-size: 12px;
      }
    }

    .submit-btn {
      margin: 2rem 1rem;
    }

    .notice {
      margin: 1rem;
    }
  
  }
}
</style> 