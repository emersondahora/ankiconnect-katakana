import { ref, watch } from 'vue'

export type PreviewMode = 'sidebar' | 'modal'

export const previewMode = ref<PreviewMode>((localStorage.getItem('anki-preview-mode') as PreviewMode) || 'sidebar')
export const currentPreviewFields = ref<Record<string, string> | null>(null)
export const currentPreviewModel = ref<string>('')
export const isModalOpen = ref(false)

watch(previewMode, (newMode) => {
  localStorage.setItem('anki-preview-mode', newMode)
})

export function togglePreviewMode() {
  previewMode.value = previewMode.value === 'sidebar' ? 'modal' : 'sidebar'
  if (previewMode.value === 'sidebar') {
    isModalOpen.value = false
  } else {
    if (currentPreviewFields.value) isModalOpen.value = true
  }
}

export function openPreviewModal(fields: Record<string, string>, modelName: string = '') {
  currentPreviewFields.value = fields
  currentPreviewModel.value = modelName
  if (previewMode.value === 'modal') {
    isModalOpen.value = true
  }
}

export function closePreviewModal() {
  isModalOpen.value = false
}
