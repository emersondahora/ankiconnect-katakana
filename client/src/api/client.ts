import axios from 'axios'
import { API_URL } from './config'
import router from '../router/index'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds (bulk uploads or multiple generations might take time)
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('auth_token')
      if (router.currentRoute.value.name !== 'Login' && router.currentRoute.value.name !== 'DatePuzzle') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)
