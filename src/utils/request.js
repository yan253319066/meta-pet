import axios from 'axios'

// 创建 axios 实例 
const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // 请求超时时间 
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器 
request.interceptors.request.use(
    config => {
        // 从 localStorage 获取 token 
        const token = localStorage.getItem('meta-token')

        // 在请求头中添加 token 
        config.headers.Authorization = `Bearer ${token}`
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器 
request.interceptors.response.use(
    response => {
        // 处理正常响应 
        return response.data  // 直接返回 data 部分 
    },
    error => {
        // 处理 401 未授权错误 
        if (error.response?.status === 401) {
            localStorage.removeItem('meta-token')
            return Promise.reject(new Error('未登录'))
        }

        // 统一错误处理 
        const message = error.response?.data?.message || error.message
        return Promise.reject(new Error(message))
    }
)

export default request 