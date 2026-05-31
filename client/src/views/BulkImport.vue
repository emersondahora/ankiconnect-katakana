<script setup lang="ts">
import { ref, onUnmounted, onMounted, computed, watch } from 'vue'
import { ImportAPI } from '../api/import'
import { ImagesAPI } from '../api/images'
import { UploadCloud, FileType, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Bell } from 'lucide-vue-next'
import AnkiPreview from '../components/AnkiPreview.vue'
import DecisionModal from '../components/DecisionModal.vue'
import DeckSelector from '../components/DeckSelector.vue'
import { isAnkiOnline, isBackendOnline } from '../composables/useAnkiStatus'
import { previewMode, currentPreviewFields, openPreviewModal } from '../composables/usePreviewMode'
import { useCache } from '../composables/useCache'

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const importState = ref<'idle' | 'processing' | 'finished'>('idle')

const progress = ref({
  current: 0,
  total: 0,
  percentage: 0
})

const logs = ref<{ id: number, status: string, word: string, error?: string, fields?: Record<string, string>, noteId?: string }[]>([])

const pendingDecisions = ref<any[]>([])
const isAutoDecisionEnabled = ref(false)
const isModalHidden = ref(false)

const selectedDeck = useCache('selected-deck', '')
const selectedModel = useCache('selected-model', 'JP::Katakana')

const activeDecision = computed(() => pendingDecisions.value.length > 0 ? pendingDecisions.value[0] : null)
const isDecisionModalOpen = computed(() => !isModalHidden.value && pendingDecisions.value.length > 0)

const autoResolveDecision = async (decision: any) => {
  try {
    const res = await ImagesAPI.search(decision.searchTerms[0], 3)
    const images = res.data
    const bestUrl = images.length > 0 ? images[0].original : ''
    
    await ImportAPI.submitDecisionJSON(decision.noteId, {
      type: 'URL',
      url: bestUrl
    })
  } catch (err) {
    console.error('Auto resolve failed', err)
    await ImportAPI.submitDecisionJSON(decision.noteId, { type: 'URL', url: '' })
  }
}

const onDecisionSubmit = (payload: { auto: boolean }) => {
  if (payload.auto) {
    isAutoDecisionEnabled.value = true
    // Automatically resolve remaining pending decisions
    for (let i = 1; i < pendingDecisions.value.length; i++) {
      autoResolveDecision(pendingDecisions.value[i])
    }
    pendingDecisions.value = []
  } else {
    // remove current decision
    pendingDecisions.value.shift()
  }
  
  // mark log as no longer pending if we want, but the server will send 'success' soon which creates a new log.
  // We can just leave the 'pending' log, the 'success' log will appear on top.
}

const previewWidth = useCache('anki-preview-width', 450)
const isResizing = ref(false)

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', handleResize)
  window.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  const newWidth = window.innerWidth - e.clientX - 24 // 24px is the right padding (p-6)
  if (newWidth >= 300 && newWidth <= 1200) {
    previewWidth.value = newWidth
  }
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', handleResize)
  window.removeEventListener('mouseup', stopResize)
}

let eventSource: EventSource | null = null

const handleFileDrop = (e: DragEvent) => {
  if (importState.value !== 'idle') return
  if (e.dataTransfer?.files.length) {
    selectedFile.value = e.dataTransfer.files[0]
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    selectedFile.value = target.files[0]
  }
}

const startSSE = () => {
  if (eventSource) eventSource.close()
  
  eventSource = new EventSource('http://localhost:3000/api/events')
  
  eventSource.addEventListener('PROGRESS', (e) => {
    const data = JSON.parse(e.data)
    progress.value.current = data.current
    progress.value.total = data.total
    progress.value.percentage = Math.round((data.current / data.total) * 100)
    
    logs.value.unshift({
      id: Date.now() + Math.random(),
      status: data.status,
      word: data.word,
      error: data.error,
      fields: data.fields
    })
    
    if (data.fields) {
      openPreviewModal(data.fields)
    }
    
    if (logs.value.length > 100) logs.value.pop() // Keep last 100
  })
  
  eventSource.addEventListener('DECISION_REQUIRED', (e) => {
    const data = JSON.parse(e.data)
    
    // Add to logs as pending
    logs.value.unshift({
      id: Date.now() + Math.random(),
      status: 'pending',
      word: data.word,
      noteId: data.noteId
    })
    
    if (isAutoDecisionEnabled.value) {
      autoResolveDecision(data)
    } else {
      pendingDecisions.value.push(data)
    }
  })
  
  eventSource.addEventListener('FINISHED', (e) => {
    importState.value = 'finished'
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  })
}

const startUpload = async () => {
  if (!selectedFile.value) return
  if (!isBackendOnline.value || !isAnkiOnline.value) {
    alert("Cannot start import: The API or Anki is offline.");
    return;
  }
  
  isUploading.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('deck', selectedDeck.value)
  formData.append('modelName', selectedModel.value)
  
  try {
    startSSE()
    importState.value = 'processing'
    logs.value = []
    progress.value = { current: 0, total: 0, percentage: 0 }
    
    await ImportAPI.uploadCSV(formData)
    
  } catch (error) {
    console.error('Upload failed', error)
    importState.value = 'idle'
    if (eventSource) eventSource.close()
  } finally {
    isUploading.value = false
  }
}

const resetImport = () => {
  selectedFile.value = null
  importState.value = 'idle'
  logs.value = []
  progress.value = { current: 0, total: 0, percentage: 0 }
  // Keep the current preview fields visible so user can still see the last card
}

onUnmounted(() => {
  if (eventSource) eventSource.close()
})
</script>

<template>
  <div class="flex h-full p-6">
    <!-- Left Column: Upload & Progress -->
    <div class="flex-1 flex flex-col space-y-6 overflow-hidden">
      
      <!-- Upload Area -->
      <div v-if="importState === 'idle'" 
           class="border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 flex flex-col items-center justify-center p-12 transition-colors hover:bg-slate-800 h-full"
           @dragover.prevent @drop.prevent="handleFileDrop">
           
        <div class="mb-10 w-full max-w-md text-left z-10 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Target Deck</label>
            <DeckSelector v-model="selectedDeck" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Anki Model</label>
            <select v-model="selectedModel" class="w-full bg-slate-700 text-white rounded p-2 border border-slate-600 focus:outline-none focus:border-indigo-500">
              <option value="JP::Katakana">JP::Katakana</option>
              <option value="JP::Kanji">JP::Kanji</option>
              <option value="JP::Vocabulary">JP::Vocabulary</option>
            </select>
          </div>
          
          <div class="mt-4 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-sm text-slate-300">
            <h4 class="font-medium text-white mb-1 flex items-center space-x-1"><AlertCircle class="w-4 h-4"/> <span>Formato do CSV esperado:</span></h4>
            <div v-if="selectedModel === 'JP::Katakana'">word,meaning,sentences,image_terms</div>
            <div v-else-if="selectedModel === 'JP::Kanji'">Kanji,Meaning,Onyomi,Kunyomi,Words,Sentences<br/><span class="text-xs text-slate-400">Listas separadas por || e significados por |</span></div>
            <div v-else-if="selectedModel === 'JP::Vocabulary'">Word,Meaning,Sentences<br/><span class="text-xs text-slate-400">Listas separadas por || e significados por |</span></div>
          </div>
        </div>
        
        <div v-if="!selectedFile" class="text-center">
          <UploadCloud class="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h3 class="text-xl font-medium text-white mb-2">Drag and drop your CSV file</h3>
          <p class="text-slate-400 mb-6">or click to browse from your computer</p>
          <button @click="fileInput?.click()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Select File
          </button>
          <input type="file" ref="fileInput" class="hidden" accept=".csv" @change="handleFileSelect" />
        </div>
        
        <div v-else class="text-center w-full max-w-md">
          <div class="flex items-center justify-center space-x-3 bg-slate-700/50 p-4 rounded-lg mb-6 border border-slate-600">
            <FileType class="w-8 h-8 text-emerald-400" />
            <div class="text-left overflow-hidden flex-1">
              <p class="text-white font-medium truncate">{{ selectedFile.name }}</p>
              <p class="text-slate-400 text-sm">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
            </div>
          </div>

          <div class="flex space-x-4 justify-center">
            <button @click="selectedFile = null" class="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Cancel
            </button>
            <button @click="startUpload" :disabled="isUploading || !isAnkiOnline || !isBackendOnline" 
                    class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2">
              <span v-if="isUploading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              <span>Start Import</span>
            </button>
          </div>
          
          <div v-if="!isAnkiOnline || !isBackendOnline" class="mt-4 p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg text-sm text-left flex items-start space-x-2">
            <AlertCircle class="w-5 h-5 shrink-0" />
            <span>Cannot import right now. Please ensure the API is running and Anki is open.</span>
          </div>
        </div>
      </div>
      
      <!-- Progress Area -->
      <div v-else class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex-1 flex flex-col min-h-0">
        <div class="mb-6">
          <div class="flex justify-between items-end mb-2">
            <div>
              <h3 class="text-xl font-bold text-white">
                {{ importState === 'finished' ? 'Import Complete!' : 'Importing Cards...' }}
              </h3>
              <p class="text-slate-400 text-sm mt-1">Processing word {{ progress.current }} of {{ progress.total }}</p>
            </div>
            <span class="text-2xl font-bold text-indigo-400">{{ progress.percentage }}%</span>
          </div>
          
          <div class="h-3 w-full bg-slate-700 rounded-full overflow-hidden mb-4">
            <div class="h-full transition-all duration-300" 
                 :class="importState === 'finished' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'" 
                 :style="{ width: `${progress.percentage}%` }"></div>
          </div>
          
          <button v-if="importState === 'finished' && pendingDecisions.length === 0" @click="resetImport" class="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors text-sm">
            <RefreshCw class="w-4 h-4" />
            <span>Import Another File</span>
          </button>

          <button v-if="pendingDecisions.length > 0 && isModalHidden" @click="isModalHidden = false" 
                  class="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors text-sm animate-pulse">
            <Bell class="w-4 h-4" />
            <span>Resume Decisions ({{ pendingDecisions.length }} pending)</span>
          </button>
        </div>
        
        <!-- Logs -->
        <div class="flex-1 overflow-y-auto bg-slate-900 rounded-lg border border-slate-700 p-4 space-y-2 font-mono text-sm">
          <div v-for="log in logs" :key="log.id" 
               @click="log.fields ? openPreviewModal(log.fields) : null"
               class="flex items-center space-x-3 p-2 rounded bg-slate-800/50 transition-colors"
               :class="{'cursor-pointer hover:bg-slate-700': log.fields, 'bg-slate-700 border-slate-600': currentPreviewFields === log.fields && previewMode === 'sidebar'}">
            <CheckCircle v-if="log.status === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
            <XCircle v-else-if="log.status === 'failed'" class="w-4 h-4 text-red-400 shrink-0" />
            <Clock v-else-if="log.status === 'pending'" class="w-4 h-4 text-indigo-400 shrink-0" />
            <AlertCircle v-else class="w-4 h-4 text-amber-400 shrink-0" />
            
            <span class="text-white w-24 truncate">{{ log.word }}</span>
            <span :class="{
              'text-emerald-400': log.status === 'success',
              'text-red-400': log.status === 'failed',
              'text-amber-400': log.status === 'skipped',
              'text-indigo-400': log.status === 'pending'
            }">{{ log.status }}</span>
            <span v-if="log.error" class="text-slate-500 ml-auto truncate flex-1 pl-4">{{ log.error }}</span>
          </div>
        </div>
      </div>
      
    </div>
    
    <!-- Resizer -->
    <div v-if="previewMode === 'sidebar'"
      class="w-4 mx-3 cursor-col-resize flex flex-col items-center justify-center shrink-0 hidden lg:flex group relative z-10"
      @mousedown.prevent="startResize">
      <div class="h-16 w-1 bg-slate-700 group-hover:bg-indigo-500 rounded-full transition-colors"></div>
    </div>
    
    <!-- Right Column: Preview -->
    <div v-if="previewMode === 'sidebar'" class="hidden lg:block shrink-0" :style="{ width: previewWidth + 'px', transition: isResizing ? 'none' : 'width 0.1s' }">
      <div v-if="currentPreviewFields" class="h-full">
        <AnkiPreview :fields="currentPreviewFields" />
      </div>
      <div v-else class="h-full border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-800/20">
        <div class="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
          <span class="text-3xl">👀</span>
        </div>
        <h3 class="text-lg font-medium text-slate-300 mb-2">Live Preview</h3>
        <p>The native Anki card preview will appear here in real-time as your cards are generated.</p>
      </div>
    </div>
    <!-- Decision Modal -->
    <DecisionModal 
      :is-open="isDecisionModalOpen" 
      :decision="activeDecision"
      @submit="onDecisionSubmit"
      @hide="isModalHidden = true"
    />
  </div>
</template>
