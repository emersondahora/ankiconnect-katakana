import { apiClient } from './client'

export const ImportAPI = {
  uploadCSV: (formData: FormData) => apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  submitDecisionFormData: (noteId: string, formData: FormData) => 
    apiClient.post(`/decisions/${noteId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  submitDecisionJSON: (noteId: string, data: any) => 
    apiClient.post(`/decisions/${noteId}`, data)
}
