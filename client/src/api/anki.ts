import { apiClient } from './client'

export const AnkiAPI = {
  getStatus: () => apiClient.get('/status'),
  
  getDecks: () => apiClient.get('/anki/decks'),
  
  getNotes: (deck: string) => apiClient.get('/anki/notes', { params: { deck } }),
  
  getTemplates: (modelName: string) => apiClient.get('/anki/templates', { params: { modelName } }),
  
  updateNote: (noteId: string, fields: Record<string, string>) => apiClient.put(`/anki/notes/${noteId}`, { fields }),
  
  uploadMedia: (formData: FormData) => apiClient.post('/anki/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  uploadMediaUrl: (url: string) => apiClient.post('/anki/media', { url })
}
