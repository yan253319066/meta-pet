import { ref } from 'vue'
import i18n from '@/i18n'

const loading = ref(false)
const loadingText = ref(i18n.global.t('marketplace.loading'))

export const useLoadingStore = () => {
    const showLoading = (text = i18n.global.t('marketplace.loading')) => {
        loadingText.value = text
        loading.value = true
    }

    const hideLoading = () => {
        loading.value = false
    }

    const showError = (message = i18n.global.t('common.error')) => {
        loading.value = false
        // 这里可以添加错误提示的逻辑
    }

    return {
        loading,
        loadingText,
        showLoading,
        hideLoading,
        showError
    }
} 