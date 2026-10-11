import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({ baseURL: BASE, withCredentials: true, timeout: 20000 })

let refreshing = false
let queue = []
const flush = (err) => {
  queue.forEach(({ res, rej }) => (err ? rej(err) : res()))
  queue = []
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
      if (refreshing)
        return new Promise((res, rej) => queue.push({ res, rej })).then(() => api(orig))
      orig._retry = true
      refreshing = true
      try {
        await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
        flush(null)
        return api(orig)
      } catch (e) {
        flush(e)
        window.dispatchEvent(new Event('auth:expired'))
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  },
)

export default api
