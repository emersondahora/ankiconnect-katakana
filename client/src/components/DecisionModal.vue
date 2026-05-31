<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImportAPI } from '../api/import'
import { Upload, CheckCircle, RefreshCw, X } from 'lucide-vue-next'
import ImageSearch from './ImageSearch.vue'

const props = defineProps<{
  decision: any
  isOpen: boolean
}>()

const emit = defineEmits(['submit', 'hide'])

const searchTerm = ref('')
const selectedImage = ref<string | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const filePreviewUrl = ref<string | null>(null)

const isAutoEnabled = ref(false)
const isSubmitting = ref(false)

watch(() => props.decision, (newDecision) => {
  if (newDecision && newDecision.searchTerms && newDecision.searchTerms.length > 0) {
    searchTerm.value = newDecision.searchTerms[0]
    selectedImage.value = null
    selectedFile.value = null
    filePreviewUrl.value = null
  }
}, { immediate: true })

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    selectedFile.value = target.files[0]
    selectedImage.value = null // clear search selection
    
    // Create preview
    if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
    filePreviewUrl.value = URL.createObjectURL(selectedFile.value)
  }
}

const handleImageSelect = (url: string) => {
  selectedImage.value = url
  selectedFile.value = null
  if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
  filePreviewUrl.value = null
}

const submit = async () => {
  if (!selectedImage.value && !selectedFile.value) return
  isSubmitting.value = true
  
  try {
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('type', 'UPLOAD')
      formData.append('auto', isAutoEnabled.value ? 'true' : 'false')
      await ImportAPI.submitDecisionFormData(props.decision.noteId, formData)
    } else {
      await ImportAPI.submitDecisionJSON(props.decision.noteId, {
        type: 'URL',
        url: selectedImage.value,
        auto: isAutoEnabled.value
      })
    }
    
    emit('submit', { auto: isAutoEnabled.value })
  } catch (e) {
    console.error('Failed to submit decision', e)
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
    <div class="bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl border border-slate-700 flex flex-col h-[90vh]">
      
      <!-- Header -->
      <div class="p-6 border-b border-slate-700 flex justify-between items-start shrink-0 bg-slate-800/80 rounded-t-xl">
        <div>
          <h2 class="text-2xl font-bold text-white mb-1">Image Selection</h2>
          <p class="text-slate-400">
            Note: <span class="font-bold text-indigo-400">{{ decision?.word }}</span> — {{ decision?.meaning }}
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <button @click="fileInput?.click()" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm">
            <Upload class="w-4 h-4" />
            <span>Upload Custom Image</span>
          </button>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />
          
          <button @click="emit('hide')" class="text-slate-400 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-hidden flex-1 flex flex-col">
        
        <!-- Local Upload Preview -->
        <div v-if="filePreviewUrl" class="mb-6 flex flex-col items-center">
          <h3 class="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Ready to Upload</h3>
          <div class="relative rounded-lg overflow-hidden border-2 border-emerald-500 inline-block">
            <img :src="filePreviewUrl" class="max-h-64 object-contain bg-slate-900" />
            <div class="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
              <CheckCircle class="w-5 h-5" />
            </div>
          </div>
          <button @click="handleImageSelect('')" class="mt-2 text-sm text-slate-400 hover:text-white">Cancel Upload</button>
        </div>
        
        <div v-else-if="selectedImage" class="mb-6 flex flex-col items-center">
          <h3 class="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Ready to use URL</h3>
          <div class="relative rounded-lg overflow-hidden border-2 border-emerald-500 inline-block">
            <img :src="selectedImage" class="max-h-64 object-contain bg-slate-900" />
            <div class="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
              <CheckCircle class="w-5 h-5" />
            </div>
          </div>
          <button @click="selectedImage = null" class="mt-2 text-sm text-slate-400 hover:text-white">Clear Selection</button>
        </div>

        <!-- Image Search Component -->
        <div class="flex-1 overflow-hidden min-h-0 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <ImageSearch :key="searchTerm" :initialSearch="searchTerm" @select="handleImageSelect" />
        </div>
        
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl flex justify-between items-center shrink-0">
        <label class="flex items-center space-x-3 cursor-pointer group">
          <div class="relative flex items-center justify-center">
            <input type="checkbox" v-model="isAutoEnabled" class="peer sr-only" />
            <div class="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
            <CheckCircle class="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <span class="text-slate-300 group-hover:text-white transition-colors">Always Use Automatic Decision</span>
        </label>
        
        <div class="flex space-x-4">
          <button @click="emit('hide')" class="px-6 py-2 text-slate-300 hover:text-white transition-colors font-medium">
            Hide
          </button>
          <button @click="submit" :disabled="(!selectedImage && !selectedFile) || isSubmitting" 
                  class="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg shadow-emerald-500/20">
            <RefreshCw v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>Confirm Image</span>
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>
