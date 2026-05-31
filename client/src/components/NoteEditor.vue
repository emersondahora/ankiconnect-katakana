<script setup lang="ts">
import { ref, watch } from 'vue'
import { AnkiAPI } from '../api/anki'
import { X, Upload, Image as ImageIcon, Eye, EyeOff, Save, CheckCircle, RefreshCw } from 'lucide-vue-next'
import ImageSearch from './ImageSearch.vue'

const props = defineProps<{
  note: any | null
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'saved'])

const editableFields = ref<Record<string, string>>({})
const fieldPreviews = ref<Record<string, boolean>>({})

const isSaving = ref(false)

// Image Generation Modal State
const isImageModalOpen = ref(false)
const currentImageField = ref<string | null>(null)
const imageSearchQuery = ref('')

watch(() => props.note, (newNote) => {
  if (newNote && newNote.fields) {
    editableFields.value = { ...newNote.fields }
    fieldPreviews.value = Object.keys(newNote.fields).reduce((acc, key) => {
      acc[key] = false
      return acc
    }, {} as Record<string, boolean>)
  }
}, { immediate: true })

const togglePreview = (field: string) => {
  fieldPreviews.value[field] = !fieldPreviews.value[field]
}

const handleFileUpload = async (event: Event, field: string) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  
  const file = target.files[0]
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const res = await AnkiAPI.uploadMedia(formData)
    const { mediaTag } = res.data
    // Append or replace? For simplicity, we can append or replace based on whether there's already content.
    // Usually, uploading media replaces the current media, or appends. Let's append with a newline.
    if (editableFields.value[field]) {
      editableFields.value[field] += ` ${mediaTag}`
    } else {
      editableFields.value[field] = mediaTag
    }
  } catch (e) {
    console.error('Failed to upload media', e)
    alert('Failed to upload media.')
  }
}

const openImageGenerator = (field: string) => {
  currentImageField.value = field
  imageSearchQuery.value = editableFields.value.Word || editableFields.value.Vocab || ''
  isImageModalOpen.value = true
}

const handleGeneratedImage = async (url: string) => {
  if (!currentImageField.value) return
  
  try {
    const res = await AnkiAPI.uploadMediaUrl(url)
    const { mediaTag } = res.data
    
    const field = currentImageField.value
    if (editableFields.value[field]) {
      editableFields.value[field] += ` ${mediaTag}`
    } else {
      editableFields.value[field] = mediaTag
    }
    
    isImageModalOpen.value = false
    currentImageField.value = null
  } catch (e) {
    console.error('Failed to process image', e)
    alert('Failed to process image.')
  }
}

const saveNote = async () => {
  if (!props.note) return
  isSaving.value = true
  try {
    // We only need to send fields back in the format expected by updateNoteFields
    // The AnkiService expects { fields: { FieldName: 'value' } }
    await AnkiAPI.updateNote(props.note.noteId, editableFields.value)
    emit('saved', editableFields.value)
    emit('close')
  } catch (e) {
    console.error('Failed to save note', e)
    alert('Failed to save note.')
  } finally {
    isSaving.value = false
  }
}

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
    <div class="bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl border border-slate-700 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-2xl font-bold text-white">Edit Note</h2>
          <p class="text-slate-400 text-sm mt-1">Model: {{ note?.modelName }}</p>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Editor Content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <div v-for="(value, field) in editableFields" :key="field" class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <div class="flex justify-between items-center mb-3">
            <label class="font-medium text-indigo-300">{{ field }}</label>
            <div class="flex space-x-2">
              <button @click="togglePreview(String(field))" class="text-xs flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <EyeOff v-if="fieldPreviews[field]" class="w-3 h-3" />
                <Eye v-else class="w-3 h-3" />
                <span>Preview</span>
              </button>
              
              <div class="relative overflow-hidden inline-block">
                <button class="text-xs flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                  <Upload class="w-3 h-3" />
                  <span>Upload</span>
                </button>
                <input type="file" @change="e => handleFileUpload(e, String(field))" class="absolute inset-0 opacity-0 cursor-pointer" title="Upload Media" />
              </div>

              <button @click="openImageGenerator(String(field))" class="text-xs flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <ImageIcon class="w-3 h-3" />
                <span>Generate</span>
              </button>
            </div>
          </div>
          
          <textarea v-model="editableFields[field]" rows="3" class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm"></textarea>
          
          <div v-if="fieldPreviews[field]" class="mt-4 p-4 bg-slate-100 text-black rounded-lg min-h-[50px] overflow-hidden" v-html="editableFields[field]"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-700 flex justify-end shrink-0 bg-slate-800 rounded-b-xl">
        <button @click="emit('close')" class="px-6 py-2 text-slate-300 hover:text-white transition-colors mr-4">
          Cancel
        </button>
        <button @click="saveNote" :disabled="isSaving" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
          <RefreshCw v-if="isSaving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
      
    </div>

    <!-- Generate Image Sub-Modal -->
    <div v-if="isImageModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      <div class="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-700 flex flex-col h-[80vh]">
        <div class="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white">Generate Image for {{ currentImageField }}</h3>
          <button @click="isImageModalOpen = false" class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="flex-1 overflow-hidden p-6">
          <ImageSearch :initialSearch="imageSearchQuery" @select="handleGeneratedImage" />
        </div>
      </div>
    </div>
  </div>
</template>
