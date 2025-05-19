export const formatDate = (dateStr) => {
    if (!dateStr) return ''

    // 处理时间戳
    let timestamp
    if (typeof dateStr === 'string') {
        timestamp = parseInt(dateStr)
    } else {
        timestamp = dateStr
    }

    // 判断时间戳位数
    if (timestamp.toString().length === 10) {
        timestamp = timestamp * 1000
    }

    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('daily')) return import.meta.env.VITE_API_BASE_URL + url;
    else
        return import.meta.env.VITE_GATEWAY + url;
}