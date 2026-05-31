import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 60000, // 60 seconds (bulk uploads or multiple generations might take time)
  headers: {
    'Content-Type': 'application/json'
  }
})
