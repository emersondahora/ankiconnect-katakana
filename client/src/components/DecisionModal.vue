<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { Search, Upload, CheckCircle, RefreshCw, X, Eye } from 'lucide-vue-next'

const props = defineProps<{
  decision: any
  isOpen: boolean
}>()

const emit = defineEmits(['submit', 'hide'])

const images = ref<{ preview: string, original: string }[]>([])
const isSearching = ref(false)
const searchTerm = ref('')
const limit = ref(10)
const selectedImage = ref<string | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const filePreviewUrl = ref<string | null>(null)

const isAutoEnabled = ref(false)
const isSubmitting = ref(false)

watch(() => props.decision, (newDecision) => {
  if (newDecision && newDecision.searchTerms && newDecision.searchTerms.length > 0) {
    searchTerm.value = newDecision.searchTerms[0]
    searchImages()
    selectedImage.value = null
    selectedFile.value = null
    filePreviewUrl.value = null
  }
}, { immediate: true })

const searchImages = async () => {
  if (!searchTerm.value) return
  isSearching.value = true
  selectedImage.value = null
  try {
    const res = await axios.get(`http://localhost:3000/api/images/search`, {
      params: { q: searchTerm.value, limit: limit.value }
    })
    images.value = res.data
  } catch (err) {
    console.error('Failed to fetch images', err)
    images.value = []
  } finally {
    isSearching.value = false
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    selectedFile.value = target.files[0]
    selectedImage.value = null // clear pexels selection
    
    // Create preview
    if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
    filePreviewUrl.value = URL.createObjectURL(selectedFile.value)
  }
}

const selectImage = (url: string) => {
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
      await axios.post(`http://localhost:3000/api/decisions/${props.decision.noteId}`, formData)
    } else {
      await axios.post(`http://localhost:3000/api/decisions/${props.decision.noteId}`, {
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
    <div class="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-700 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="p-6 border-b border-slate-700 flex justify-between items-start shrink-0">
        <div>
          <h2 class="text-2xl font-bold text-white mb-1">Image Selection</h2>
          <p class="text-slate-400">
            Note: <span class="font-bold text-indigo-400">{{ decision?.word }}</span> — {{ decision?.meaning }}
          </p>
        </div>
        <button @click="emit('hide')" class="text-slate-400 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto flex-1">
        
        <!-- Search Bar -->
        <div class="flex space-x-4 mb-6">
          <div class="flex-1 relative">
            <Search class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input v-model="searchTerm" @keyup.enter="searchImages" type="text" placeholder="Search for images..." 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div class="w-32 relative">
             <input v-model.number="limit" @keyup.enter="searchImages" type="number" min="1" max="80"
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" title="Quantity of images" />
          </div>
          <button @click="searchImages" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <RefreshCw v-if="isSearching" class="w-4 h-4 animate-spin" />
            <span>Search</span>
          </button>
        </div>

        <!-- Local Upload or Preview -->
        <div v-if="filePreviewUrl" class="mb-6">
          <h3 class="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Uploaded Image</h3>
          <div class="relative rounded-lg overflow-hidden border-2 border-emerald-500 inline-block">
            <img :src="filePreviewUrl" class="max-h-64 object-contain bg-slate-900" />
            <div class="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
              <CheckCircle class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- Image Grid -->
        <div>
          <div class="flex justify-between items-end mb-3">
            <h3 class="text-sm font-medium text-slate-400 uppercase tracking-wider">Pexels Results</h3>
            <button @click="fileInput?.click()" class="text-indigo-400 hover:text-indigo-300 text-sm flex items-center space-x-1">
              <Upload class="w-4 h-4" />
              <span>Upload Custom Image</span>
            </button>
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />
          </div>
          
          <div v-if="isSearching" class="py-12 flex justify-center">
            <RefreshCw class="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <div v-else-if="images.length === 0" class="py-12 text-center text-slate-500 bg-slate-900 rounded-lg border border-slate-800">
            No images found for "{{ searchTerm }}"
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="img in images" :key="img.preview" 
                 @click="selectImage(img.original)"
                 class="relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-video bg-slate-900 group"
                 :class="selectedImage === img.original ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-transparent hover:border-slate-500'">
              <img :src="img.preview" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div v-if="selectedImage === img.original" class="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                <CheckCircle class="w-4 h-4" />
              </div>
            </div>
          </div>
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
                  class="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
            <RefreshCw v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>Confirm Image</span>
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>
