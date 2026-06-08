import axios from 'axios'
import { API_URL } from './config'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds (bulk uploads or multiple generations might take time)
  headers: {
    'Content-Type': 'application/json'
  }
})
