<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { Maximize2, Minimize2, X, PanelRightClose, Sun, Moon } from 'lucide-vue-next'
import { previewMode, togglePreviewMode, closePreviewModal } from '../composables/usePreviewMode'

const props = defineProps<{
  fields: Record<string, string>
  modelName?: string
}>()

const templates = ref<Record<string, { Front: string, Back: string }>>({})
const activeTemplateName = ref('')
const styling = ref('')
const isLoading = ref(true)
const showBack = ref(false)

const isDarkMode = ref(localStorage.getItem('anki-preview-dark') === 'true')

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('anki-preview-dark', isDarkMode.value.toString())
}

// Reset showBack when fields change
watch(() => props.fields, () => {
  showBack.value = false
}, { deep: true })

watch(activeTemplateName, () => {
  showBack.value = false
})

const fetchTemplates = async () => {
  isLoading.value = true
  try {
    const url = props.modelName ? `http://localhost:3000/api/anki/templates?modelName=${encodeURIComponent(props.modelName)}` : 'http://localhost:3000/api/anki/templates'
    const res = await axios.get(url)
    templates.value = res.data.templates
    if (Object.keys(templates.value).length > 0) {
      activeTemplateName.value = Object.keys(templates.value)[0]
    }
    styling.value = res.data.styling
  } catch (e) {
    console.error('Failed to load Anki templates', e)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.modelName, () => {
  fetchTemplates()
})

onMounted(() => {
  fetchTemplates()
})

const processAudioTags = (html: string) => {
  // Replace [sound:file.mp3]
  let processed = html.replace(/\[sound:(.*?)\]/g, (match, filename) => {
    return `
      <div class="inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full cursor-pointer transition-colors border border-indigo-200 shadow-sm mx-1 my-1" onclick="new Audio('http://localhost:3000/api/media/${filename}').play()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        <span class="text-sm font-medium">Play Audio</span>
      </div>
    `
  })

  // Replace local images <img src="filename.jpg"> to point to /api/media/filename.jpg
  processed = processed.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (match, pre, src, post) => {
    if (src.startsWith('http') || src.startsWith('data:')) return match
    return `<img${pre}src="http://localhost:3000/api/media/${encodeURIComponent(src)}"${post}>`
  })

  return processed
}

const getRenderedHtml = (templateType: 'Front' | 'Back') => {
  if (!templates.value || !activeTemplateName.value) return ''
  const activeTemplate = templates.value[activeTemplateName.value]
  if (!activeTemplate) return ''
  
  let html = activeTemplate[templateType] || ''
  
  // Replace {{Field}} with actual field data
  for (const [key, value] of Object.entries(props.fields)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    html = html.replace(regex, value)
  }
  
  return processAudioTags(html)
}
</script>

<template>
  <div class="rounded-xl shadow-lg overflow-hidden flex flex-col h-full transition-colors"
       :class="isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'">
    <div class="px-4 py-3 border-b text-sm font-medium flex justify-between items-center shrink-0"
         :class="isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'">
      <div class="flex items-center space-x-2">
        <span class="font-semibold" :class="isDarkMode ? 'text-slate-200' : 'text-slate-700'">Preview</span>
        <span class="px-2 py-0.5 rounded-full text-xs truncate max-w-[120px]" 
              :class="isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'"
              :title="activeTemplateName">{{ activeTemplateName }}</span>
      </div>
      <div class="flex items-center space-x-1">
        <!-- Dark mode toggle -->
        <button @click="toggleDarkMode" class="p-1.5 rounded-md transition-colors"
                :class="isDarkMode ? 'hover:bg-slate-700 hover:text-amber-400' : 'hover:bg-slate-200 hover:text-indigo-600'" title="Toggle Dark Mode">
          <Sun v-if="isDarkMode" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
        
        <!-- View mode controls -->
        <template v-if="previewMode === 'sidebar'">
          <button @click="togglePreviewMode" class="p-1.5 rounded-md transition-colors hover:text-indigo-600 hover:bg-slate-200" :class="isDarkMode ? 'hover:bg-slate-700' : ''" title="Fullscreen">
            <Maximize2 class="w-4 h-4" />
          </button>
        </template>
        <template v-else>
          <button @click="togglePreviewMode" class="p-1.5 rounded-md transition-colors hover:text-indigo-600 hover:bg-slate-200" :class="isDarkMode ? 'hover:bg-slate-700' : ''" title="Dock to sidebar">
            <PanelRightClose class="w-4 h-4" />
          </button>
          <button @click="closePreviewModal" class="p-1.5 rounded-md transition-colors hover:text-red-500 hover:bg-slate-200" :class="isDarkMode ? 'hover:bg-slate-700 hover:text-red-400' : ''" title="Close">
            <X class="w-4 h-4" />
          </button>
        </template>
      </div>
    </div>
    
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2" :class="isDarkMode ? 'border-indigo-400' : 'border-indigo-600'"></div>
    </div>
    
    <div v-else class="flex-1 flex flex-col min-h-0 relative transition-colors" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">
      <!-- Tabs for multiple cards -->
      <div class="border-b flex overflow-x-auto shrink-0 px-2" v-if="Object.keys(templates).length > 1"
           :class="isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50'">
        <button v-for="(_, name) in templates" :key="name" 
          @click="activeTemplateName = String(name)"
          :class="['px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors', 
                   activeTemplateName === name 
                     ? (isDarkMode ? 'border-indigo-400 text-indigo-300' : 'border-indigo-600 text-indigo-700') 
                     : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')]">
          {{ name }}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 flex flex-col items-center relative pb-24">
        <!-- CSS injection -->
        <component is="style" type="text/css">
          .anki-preview-container {
            {{ styling }}
          }
          /* Dark mode overrides for common Anki classes */
          .dark-mode-preview.anki-preview-container {
            background-color: transparent !important;
            color: #f1f5f9 !important;
          }
          .dark-mode-preview.anki-preview-container .nightMode { /* if template supports native nightMode class */
            display: block;
          }
          .anki-preview-container img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px auto; }
        </component>
      
        <!-- container -->
        <div class="anki-preview-container w-full flex flex-col items-center justify-center min-h-[200px]"
             :class="{'dark-mode-preview': isDarkMode, 'nightMode': isDarkMode}">
          <div v-if="!showBack" class="w-full text-center" v-html="getRenderedHtml('Front')"></div>
          <div v-else class="w-full text-center" v-html="getRenderedHtml('Back')"></div>
        </div>
      </div>
      
      <!-- Fixed bottom button -->
      <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t flex justify-center pt-8 pointer-events-none"
           :class="isDarkMode ? 'from-slate-900 via-slate-900/90 to-transparent' : 'from-white via-white/90 to-transparent'">
        <button v-if="!showBack" @click="showBack = true" class="pointer-events-auto px-8 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all w-full max-w-[250px] active:scale-95"
                :class="isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'">
          Show Answer
        </button>
        <button v-else @click="showBack = false" class="pointer-events-auto px-8 py-3 rounded-xl font-medium shadow-sm transition-all w-full max-w-[250px] active:scale-95"
                :class="isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'">
          Show Front
        </button>
      </div>
    </div>
  </div>
</template>
