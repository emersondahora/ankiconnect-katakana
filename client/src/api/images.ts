import { apiClient } from './client'

export const ImagesAPI = {
  search: (q: string, limit: number, source?: string) => 
    apiClient.get('/images/search', { params: { q, limit, source } })
}
