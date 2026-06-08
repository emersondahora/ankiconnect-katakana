<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { AnkiAPI } from '../api/anki'
import { Maximize2, X, PanelRightClose, Sun, Moon, Edit } from 'lucide-vue-next'
import { previewMode, togglePreviewMode, closePreviewModal } from '../composables/usePreviewMode'

const props = defineProps<{
  fields: Record<string, string>
  modelName?: string
}>()

const emit = defineEmits<{
  (e: 'edit'): void
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
    const res = await AnkiAPI.getTemplates(props.modelName || '')
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
  let processed = html.replace(/\[sound:(.*?)\]/g, (_match, filename) => {
    return `
      <div class="audio-btn" onclick="new Audio('http://localhost:3000/api/media/' + encodeURIComponent('${filename}')).play()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        <span>Play Audio</span>
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

const renderAnkiTemplate = (html: string, fields: Record<string, string>) => {
  let result = html

  // 1. Condicionais: {{#Field}}...{{/Field}} e {{^Field}}...{{/Field}}
  for (const [key, value] of Object.entries(fields)) {
    const isTruthy = value && value.trim() !== ''
    
    // Regex para {{#Field}}...{{/Field}}
    const posRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g')
    result = result.replace(posRegex, isTruthy ? '$1' : '')

    // Regex para {{^Field}}...{{/Field}}
    const negRegex = new RegExp(`{{\\^${key}}}([\\s\\S]*?){{/${key}}}`, 'g')
    result = result.replace(negRegex, !isTruthy ? '$1' : '')
  }

  // 2. Filtros e Substituição Básica
  for (const [key, value] of Object.entries(fields)) {
    // Process Furigana (Kanji[kana])
    const furiganaRegex = new RegExp(`{{furigana:${key}}}`, 'g')
    result = result.replace(furiganaRegex, () => {
      if (!value) return ''
      return value.replace(/ ?([^\s\[]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>')
    })

    const kanjiRegex = new RegExp(`{{kanji:${key}}}`, 'g')
    result = result.replace(kanjiRegex, () => {
      if (!value) return ''
      return value.replace(/ ?([^\s\[]+)\[([^\]]+)\]/g, '$1')
    })

    const kanaRegex = new RegExp(`{{kana:${key}}}`, 'g')
    result = result.replace(kanaRegex, () => {
      if (!value) return ''
      return value.replace(/ ?([^\s\[]+)\[([^\]]+)\]/g, '$2')
    })

    // Substituição normal {{Field}}
    const normalRegex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(normalRegex, value)
  }

  // Remove any unmatched tags
  result = result.replace(/{{[^}]+}}/g, '')

  return result
}

const iframeHtml = computed(() => {
  if (!templates.value || !activeTemplateName.value) return ''
  const activeTemplate = templates.value[activeTemplateName.value]
  if (!activeTemplate) return ''
  
  let html = activeTemplate[showBack.value ? 'Back' : 'Front'] || ''
  html = renderAnkiTemplate(html, props.fields)
  html = processAudioTags(html)
  
  return `
    <!DOCTYPE html>
    <html class="${isDarkMode.value ? 'nightMode' : ''}">
    <head>
      <meta charset="utf-8">
      <base href="http://localhost:3000/api/media/">
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          background-color: transparent !important;
          color: ${isDarkMode.value ? '#f1f5f9' : '#1e293b'} !important;
          font-family: system-ui, -apple-system, sans-serif;
        }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px auto; }
        .audio-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background-color: #eef2ff; color: #4f46e5;
          padding: 0.375rem 0.75rem; border-radius: 9999px;
          cursor: pointer; border: 1px solid #e0e7ff;
          font-family: system-ui; font-size: 0.875rem; font-weight: 500;
          margin: 4px;
        }
        .nightMode .audio-btn {
          background-color: #312e81; color: #a5b4fc; border-color: #3730a3;
        }
        ${styling.value}
      </style>
    </head>
    <body class="card ${isDarkMode.value ? 'nightMode' : ''}">
      ${html}
    </body>
    </html>
  `
})
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
        <!-- Edit button (sidebar only) — same ghost style as other icons -->
        <button v-if="previewMode === 'sidebar'"
                @click="emit('edit')"
                class="p-1.5 rounded-md transition-colors flex items-center space-x-1"
                :class="isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-indigo-300' : 'text-slate-500 hover:bg-slate-200 hover:text-indigo-600'"
                title="Edit Note">
          <Edit class="w-4 h-4" />
        </button>

        <!-- Dark mode toggle -->
        <button @click="toggleDarkMode" class="p-1.5 rounded-md transition-colors"
                :class="isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-amber-400' : 'text-slate-500 hover:bg-slate-200 hover:text-indigo-600'" title="Toggle Dark Mode">
          <Sun v-if="isDarkMode" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
        
        <!-- View mode controls -->
        <template v-if="previewMode === 'sidebar'">
          <button @click="togglePreviewMode" class="p-1.5 rounded-md transition-colors" :class="isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-indigo-600'" title="Fullscreen">
            <Maximize2 class="w-4 h-4" />
          </button>
        </template>
        <template v-else>
          <button @click="togglePreviewMode" class="p-1.5 rounded-md transition-colors" :class="isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-indigo-600'" title="Dock to sidebar">
            <PanelRightClose class="w-4 h-4" />
          </button>
          <button @click="closePreviewModal" class="p-1.5 rounded-md transition-colors" :class="isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-red-400' : 'text-slate-500 hover:bg-slate-200 hover:text-red-500'" title="Close">
            <X class="w-4 h-4" />
          </button>
        </template>
      </div>  <!-- end buttons -->
    </div>  <!-- end header bar -->

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

      <!-- Content: scrolls, button stays pinned at bottom -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Scrollable card body -->
        <div class="flex-1 p-0 relative">
          <iframe 
            class="w-full h-full border-0 absolute inset-0"
            :srcdoc="iframeHtml"
            sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
          ></iframe>
        </div>

        <!-- Always-visible toggle button pinned at the bottom -->
        <div class="shrink-0 px-4 py-3 border-t flex justify-center"
             :class="isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'">
          <button v-if="!showBack" @click="showBack = true"
                  class="px-8 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all w-full max-w-[260px] active:scale-95"
                  :class="isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'">
            Show Answer
          </button>
          <button v-else @click="showBack = false"
                  class="px-8 py-2.5 rounded-xl font-medium shadow-sm transition-all w-full max-w-[260px] active:scale-95"
                  :class="isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'">
            Show Front
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
