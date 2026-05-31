<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ImagesAPI } from '../api/images'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-vue-next'
import { useCache } from '../composables/useCache'

const props = defineProps<{
  initialSearch?: string
}>()

const emit = defineEmits<{
  (e: 'select', url: string): void
}>()

const searchTerm = ref(props.initialSearch || '')
const limit = ref(10)
const source = useCache('image-search-source', 'pexels')
const isSearching = ref(false)
const searchResults = ref<{ preview: string, original: string }[]>([])
const currentPage = ref(0)
const itemsPerPage = 3

const searchImages = async () => {
  if (!searchTerm.value) return
  isSearching.value = true
  try {
    const res = await ImagesAPI.search(searchTerm.value, limit.value, source.value)
    searchResults.value = res.data
    currentPage.value = 0
  } catch (error) {
    console.error('Failed to search images', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const nextPage = () => {
  if ((currentPage.value + 1) * itemsPerPage < searchResults.value.length) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

const selectImage = (url: string) => {
  emit('select', url)
}

onMounted(() => {
  // Wait for explicit search click
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Controls -->
    <div class="flex space-x-3 mb-6">
      <div class="flex-1 relative">
        <Search class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input v-model="searchTerm" @keyup.enter="searchImages" type="text" placeholder="Search for images..." 
               class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div class="w-24 relative shrink-0">
         <input v-model.number="limit" @keyup.enter="searchImages" type="number" min="1" max="80"
               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" title="Quantity" />
      </div>
      <div class="w-48 shrink-0">
        <select v-model="source" @change="searchImages" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="pexels">Pexels (Photos)</option>
          <option value="pollinations_ai">Pollinations (AI)</option>
        </select>
      </div>
      <button @click="searchImages" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shrink-0">
        <RefreshCw v-if="isSearching" class="w-4 h-4 animate-spin" />
        <span v-else>Search</span>
      </button>
    </div>

    <!-- Results -->
    <div v-if="searchResults.length > 0" class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-3 gap-4">
        <div v-for="(img, idx) in searchResults.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)" :key="idx" 
             @click="selectImage(img.original)"
             class="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-500 transition-all">
          <img :src="img.preview" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-colors flex items-center justify-center">
            <span class="opacity-0 group-hover:opacity-100 bg-indigo-600 text-white px-3 py-1.5 rounded font-medium shadow-lg transform scale-95 group-hover:scale-100 transition-all">
              Select
            </span>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div class="flex items-center justify-between mt-6 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
        <button @click="prevPage" :disabled="currentPage === 0" 
                class="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors">
          <ChevronLeft class="w-5 h-5" />
        </button>
        <span class="text-slate-400 font-medium">Page {{ currentPage + 1 }} of {{ Math.ceil(searchResults.length / itemsPerPage) }}</span>
        <button @click="nextPage" :disabled="(currentPage + 1) * itemsPerPage >= searchResults.length"
                class="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
    <div v-else-if="!isSearching" class="flex-1 flex flex-col items-center justify-center text-slate-500 pb-12">
      <ImageIcon class="w-16 h-16 mb-4 opacity-50" />
      <p class="text-lg">No images found. Try a different search.</p>
    </div>
  </div>
</template>
