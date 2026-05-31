import { ref } from 'vue'
import { AnkiAPI } from '../api/anki'

export const isAnkiOnline = ref(false)
export const isBackendOnline = ref(false)
export const isChecking = ref(true)

export async function checkStatus() {
  isChecking.value = true
  try {
    const res = await AnkiAPI.getStatus()
    isBackendOnline.value = true
    isAnkiOnline.value = res.data.ankiOnline
  } catch (error) {
    isBackendOnline.value = false
    isAnkiOnline.value = false
  } finally {
    isChecking.value = false
  }
}
