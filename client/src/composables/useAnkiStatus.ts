import { ref } from 'vue'
import axios from 'axios'

export const isAnkiOnline = ref(false)
export const isBackendOnline = ref(false)
export const isChecking = ref(true)

export async function checkStatus() {
  isChecking.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/status')
    isBackendOnline.value = true
    isAnkiOnline.value = res.data.ankiOnline
  } catch (e) {
    isBackendOnline.value = false
    isAnkiOnline.value = false
  } finally {
    isChecking.value = false
  }
}
