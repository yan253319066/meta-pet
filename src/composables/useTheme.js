import { ref, watch } from 'vue'

const THEME_KEY = 'meta-pet-theme'
const theme = ref(localStorage.getItem(THEME_KEY) || 'dark')

export function useTheme() {
    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
        localStorage.setItem(THEME_KEY, theme.value)
    }

    watch(theme, (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme)
    }, { immediate: true })

    return {
        theme,
        toggleTheme
    }
} 