<template>
  <div class="record-page">
    <div class="record-header">
      <van-nav-bar
        :title="t('record.title')"
        left-arrow
        @click-left="onBack"
      />
    </div>

    <div class="record-content">
      <div class="record-form">
        <!-- 视频上传 -->
        <div class="form-item">
          <div class="upload-title">
            <span>{{ t('record.uploadVideo') }}</span>
            <span class="upload-tip">{{ t('record.videoTip') }}</span>
          </div>
          <van-uploader
            v-model="video"
            :max-size="1024 * 1024 * 5"
            :max-count="1"
            :after-read="afterVideoRead"
            @delete="onVideoDelete"
            @oversize="onVideoOversize"
            accept="video/*"
          >
            <template #preview-cover="{ file }">
              <div class="preview-cover">
                <van-icon name="delete" class="delete-icon" @click.stop="onVideoDelete(file)" />
              </div>
            </template>
          </van-uploader>
        </div>

        <!-- 图片上传 -->
        <div class="form-item">
          <div class="upload-title">
            <span>{{ t('record.uploadImages') }}</span>
            <span class="upload-tip">{{ t('record.imagesTip') }}</span>
          </div>
          <van-uploader
            v-model="images"
            multiple
            :max-size="500 * 1024"
            :max-count="9"
            :after-read="afterImageRead"
            @delete="onImageDelete"
            @oversize="onImageOversize"
          >
            <template #preview-cover="{ file }">
              <div class="preview-cover">
                <van-icon name="delete" class="delete-icon" @click.stop="onImageDelete(file)" />
              </div>
            </template>
          </van-uploader>
        </div>

        <!-- 文字描述 -->
        <div class="form-item">
          <div class="upload-title">
            <span>{{ t('record.description') }}</span>
            <span class="upload-tip">{{ t('record.descriptionTip') }}</span>
          </div>
          <van-field
            v-model="description"
            type="textarea"
            :placeholder="t('record.descriptionPlaceholder')"
            :autosize="{ minHeight: 100 }"
            maxlength="500"
            show-word-limit
          />
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <van-button 
          type="primary" 
          block 
          :loading="submitting"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ t('record.publish') }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import { addLog, uploadFee, getBalanceEth } from '@/services/wallet'
import { useLoadingStore } from '@/store/loadingStore'
import { useI18n } from 'vue-i18n'
import { store } from '@/store/appkitStore'

const { t } = useI18n()

const loadingStore = useLoadingStore()

const router = useRouter()
const route = useRoute()
const nftId = route.params.id

const description = ref('')
const images = ref([])
const video = ref([])
const submitting = ref(false)

// 是否可以提交
const canSubmit = computed(() => {
  return description.value.trim() || images.value.length > 0 || video.value.length > 0
})

// 返回上一页
const onBack = () => {
  router.back()
}

const onVideoOversize = (file) =>{
  showToast('The file size must not exceed 5M.');
}
const onImageOversize = (file) =>{
  showToast('The file size must not exceed 500kb.');
}

// 图片上传后的处理
const afterImageRead = (file) => {
  // 这里可以处理图片压缩等
  // console.log('图片上传成功:', file)
  showToast(t('record.uploadSuccess'))
}

// 视频上传后的处理
const afterVideoRead = (file) => {
  // 这里可以处理视频压缩等
  // console.log('视频上传成功:', file)
  showToast(t('record.uploadSuccess'))
}

// 删除图片
const onImageDelete = (file) => {
  const index = images.value.indexOf(file)
  if (index !== -1) {
    images.value.splice(index, 1)
  }
}

// 删除视频
const onVideoDelete = (file) => {
  const index = video.value.indexOf(file)
  if (index !== -1) {
    video.value.splice(index, 1)
  }
}

// 提交表单
const onSubmit = async () => {
  if (!canSubmit.value) return
  
  submitting.value = true
  try {
    loadingStore.showLoading()
    const formData = new FormData()
    formData.append('description', description.value)
    formData.append('tokenId', nftId)
    
    // 添加图片
    images.value.forEach((file, index) => {
      formData.append(`images`, file.file)
    })
    
    // 添加视频
    if (video.value.length > 0) {
      formData.append('video', video.value[0].file)
    }
    
    const res = await request.post('/diary/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (res.code === 401) {
      showToast(t('record.pleaseLogin'))
    } else if (res.code === 200) {
      const fee = await uploadFee()
      const ethBalance = await getBalanceEth(store.accountState.address)
      if(ethBalance < fee) return showToast(t('marketplace.insufficientBalance'))
      const hash = await addLog(nftId, res.data, true, fee);
      showToast(t('record.publishSuccess'))
      router.back()
    } else {
      showToast(res.msg || t('record.publishFailed'))
    }
  } catch (error) {
    // console.error('发布失败:', error)
    showToast(t('record.publishFailed'))
  } finally {
    submitting.value = false
    loadingStore.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.record-page {
  min-height: 100vh;
  background: var(--mt-bg);
  display: flex;
  flex-direction: column;
}

.record-header {
  background: var(--mt-bg-secondary);

  :deep(.van-nav-bar) {

    .van-nav-bar__title {
      color: var(--mt-text);
    }

    .van-icon {
      color: var(--mt-primary);
    }
  }
}

.record-content {
  flex: 1;
  padding: 0.5rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.record-form {
  background: var(--mt-bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .form-item {
    .upload-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      color: var(--mt-text);
      font-size: 0.95rem;
      font-weight: 500;

      .upload-tip {
        color: var(--mt-text-secondary);
        font-size: 0.85rem;
      }
    }

    :deep(.van-uploader) {
      .van-uploader__wrapper {
        gap: 0.5rem;
      }

      .van-uploader__preview {
        width: 90px;
        height: 90px;
        border-radius: 8px;
        overflow: hidden;
      }

      .van-uploader__preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    :deep(.van-field) {
      background: var(--mt-bg);
      border-radius: 8px;
      padding: 0.5rem;

      .van-field__word-limit {
        color: var(--mt-text-secondary);
        font-size: 0.85rem;
      }
    }
  }
}

.preview-cover {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }

  .delete-icon {
    color: white;
    font-size: 1.2rem;
  }
}

.submit-section {
  padding: 0.5rem 0;

  .van-button {
    height: 40px;
    border-radius: 20px;
    font-size: 0.95rem;
    font-weight: 500;
    background: var(--mt-primary);
    border-color: var(--mt-primary);
  }
}
</style> 