<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { AnkiAPI } from '../api/anki'
import { Folder, Search, FileText, Edit } from 'lucide-vue-next'
import AnkiPreview from '../components/AnkiPreview.vue'
import NoteEditor from '../components/NoteEditor.vue'
import DeckSelector from '../components/DeckSelector.vue'
import { isAnkiOnline, isBackendOnline } from '../composables/useAnkiStatus'
import { previewMode, currentPreviewFields, currentPreviewModel, openPreviewModal } from '../composables/usePreviewMode'
import { useCache } from '../composables/useCache'

const selectedDeck = useCache('selected-deck', '')
const notes = ref<any[]>([])
const isLoadingNotes = ref(false)
const searchQuery = ref('')

const isEditorOpen = ref(false)
const editingNote = ref<any>(null)

const previewWidth = ref(450)
const isResizing = ref(false)

const stripHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '')
}

onMounted(async () => {
  const savedWidth = localStorage.getItem('anki-preview-width')
  if (savedWidth) {
    const parsed = parseInt(savedWidth, 10)
    if (!isNaN(parsed) && parsed >= 300 && parsed <= 1200) {
      previewWidth.value = parsed
    }
  }
  if (selectedDeck.value && isBackendOnline.value && isAnkiOnline.value) {
    await fetchNotes()
  }
})

watch(
  [selectedDeck, isBackendOnline, isAnkiOnline],
  async ([deck, backendOnline, ankiOnline]) => {
    if (deck && backendOnline && ankiOnline) {
      await fetchNotes()
    } else {
      notes.value = []
    }
  }
)

const fetchNotes = async () => {
  if (!selectedDeck.value) return
  isLoadingNotes.value = true
  try {
    const res = await AnkiAPI.getNotes(selectedDeck.value)
    notes.value = res.data
  } catch (e) {
    console.error('Failed to fetch notes', e)
  } finally {
    isLoadingNotes.value = false
  }
}

const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  const q = searchQuery.value.toLowerCase()
  return notes.value.filter(n => {
    return Object.values(n.fields).some(val => stripHtml(String(val)).toLowerCase().includes(q))
  })
})

const handleNoteClick = (note: any) => {
  const isLgScreen = window.innerWidth >= 1024
  openPreviewModal(note.fields, note.modelName, !isLgScreen)
}

const openEditor = (note: any) => {
  editingNote.value = note
  isEditorOpen.value = true
}

const handleNoteSaved = (updatedFields: Record<string, string>) => {
  // Update local state for immediate feedback
  if (editingNote.value) {
    editingNote.value.fields = updatedFields
    // Refresh preview if it's currently selected
    if (currentPreviewFields.value === editingNote.value.fields || 
        (currentPreviewFields.value && currentPreviewFields.value.Word === updatedFields.Word)) {
      openPreviewModal(updatedFields, editingNote.value.modelName)
    }
  }
}

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', handleResize)
  window.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  const newWidth = window.innerWidth - e.clientX - 24
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
  localStorage.setItem('anki-preview-width', previewWidth.value.toString())
}
</script>

<template>
  <div class="flex h-full p-6">
    <!-- Left Column: Browser -->
    <div class="flex-1 flex flex-col space-y-4 overflow-hidden">
      <div class="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 shadow-sm flex items-center gap-3 shrink-0 min-w-0">
        <Folder class="w-5 h-5 text-indigo-400 shrink-0" />
        <!-- Deck selector: fixed width, shrinks if needed -->
        <div class="min-w-0" style="flex: 0 0 min(24rem, 50%)">
          <DeckSelector v-model="selectedDeck" :allowCreate="false" placeholder="Select a deck to view..." />
        </div>
        <!-- Search: takes remaining space -->
        <div class="relative flex-1 min-w-0">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search class="w-4 h-4 text-slate-400" />
          </div>
          <input v-model="searchQuery" type="text"
                 class="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2.5"
                 placeholder="Search notes...">
        </div>
      </div>
      
      <!-- No Deck Selected State -->
      <div v-if="!selectedDeck" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-800/50 rounded-xl border border-dashed border-slate-700 shadow-sm">
        <Folder class="w-16 h-16 text-indigo-500/30 mb-4" />
        <h3 class="text-xl font-medium text-slate-300 mb-2">No deck selected</h3>
        <p class="text-slate-500 max-w-md">Please select a deck from the dropdown above to view and edit its notes.</p>
      </div>
      
      <!-- Notes List -->
      <div v-else class="flex-1 bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div class="p-3 bg-slate-800/50 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
          <span>{{ filteredNotes.length }} Notes</span>
        </div>
        
        <div v-if="isLoadingNotes" class="flex-1 flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <div v-else class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-for="note in filteredNotes" :key="note.noteId" 
               @click="handleNoteClick(note)"
               class="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors border border-transparent hover:border-slate-600 group"
               :class="{'bg-slate-700 border-slate-600': currentPreviewFields === note.fields && previewMode === 'sidebar'}">
            <FileText class="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0" />
            <div class="truncate flex-1 text-sm text-slate-200">
              <span class="font-medium mr-2">{{ stripHtml(Object.values(note.fields)[0] as string) }}</span>
              <span class="text-slate-500">{{ stripHtml(Object.values(note.fields)[1] as string) }}</span>
            </div>
            
            <div class="flex items-center space-x-2 shrink-0">
              <button @click.stop="openEditor(note)" class="p-1.5 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 rounded">
                <Edit class="w-4 h-4" />
              </button>
              <span v-if="note.status" class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                    :class="{
                      'bg-blue-500/20 text-blue-300': note.status === 'New',
                      'bg-amber-500/20 text-amber-300': note.status === 'Learning',
                      'bg-lime-500/20 text-lime-300': note.status === 'Review',
                      'bg-emerald-500/20 text-emerald-300': note.status === 'Mature',
                      'bg-slate-500/20 text-slate-400': note.status === 'Suspended'
                    }">
                {{ note.status }}
              </span>
              <span v-if="note.ivl > 0" class="text-xs font-mono text-slate-400 min-w-[32px] text-right" title="Interval in days">
                {{ note.ivl }}d
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Resizer (only when sidebar preview is active) -->
    <div v-if="previewMode === 'sidebar'"
      class="w-4 mx-3 cursor-col-resize flex flex-col items-center justify-center shrink-0 hidden lg:flex group relative z-10"
      @mousedown.prevent="startResize">
      <div class="h-16 w-1 bg-slate-700 group-hover:bg-indigo-500 rounded-full transition-colors"></div>
    </div>
    
    <!-- Right Column: Sidebar Preview -->
    <div v-if="previewMode === 'sidebar'" class="hidden lg:flex shrink-0 flex-col" :style="{ width: previewWidth + 'px', transition: isResizing ? 'none' : 'width 0.1s' }">
      <div v-if="currentPreviewFields" class="h-full">
        <AnkiPreview
          :fields="currentPreviewFields"
          :modelName="currentPreviewModel"
          @edit="openEditor(notes.find(n => n.fields === currentPreviewFields) || { fields: currentPreviewFields, modelName: currentPreviewModel })"
        />
      </div>
      <div v-else class="h-full border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-800/20">
        <div class="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
          <span class="text-3xl">👀</span>
        </div>
        <h3 class="text-lg font-medium text-slate-300 mb-2">Select a Note</h3>
        <p>Click on any note to view its native Anki preview.</p>
      </div>
    </div>
    
    <NoteEditor 
      :isOpen="isEditorOpen" 
      :note="editingNote" 
      @close="isEditorOpen = false" 
      @saved="handleNoteSaved" 
    />
  </div>
</template>
