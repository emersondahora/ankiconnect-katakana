<script setup lang="ts">
import { ref, computed } from 'vue'
import { ImportAPI } from '../api/import'
import DeckSelector from '../components/DeckSelector.vue'
import { useCache } from '../composables/useCache'
import { openPreviewModal } from '../composables/usePreviewMode'
import { Save, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-vue-next'

const selectedDeck = useCache('selected-deck', '')
const selectedModel = useCache('selected-model', 'JP::Vocabulary')

const isSubmitting = ref(false)
const statusMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

// Campos dinâmicos
const formData = ref<Record<string, any>>({
  Kanji: '', Meaning: '', Onyomi: '', Kunyomi: '', Words: '', Sentences: '', Word: '', _generateImage: false
})
const imageFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    imageFile.value = target.files[0]
  }
}

const clearForm = () => {
  const lastGen = formData.value._generateImage
  formData.value = { Kanji: '', Meaning: '', Onyomi: '', Kunyomi: '', Words: '', Sentences: '', Word: '', _generateImage: lastGen }
  imageFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const submitManual = async (forceUpdate = false) => {
  if (!selectedDeck.value) {
    statusMessage.value = { type: 'error', text: 'Selecione um deck destino.' }
    return
  }
  
  isSubmitting.value = true
  statusMessage.value = null
  
  const payload = new FormData()
  payload.append('deck', selectedDeck.value)
  payload.append('modelName', selectedModel.value)
  payload.append('forceUpdate', forceUpdate ? 'true' : 'false')
  
  // Appends os campos dependendo do modelo
  if (selectedModel.value === 'JP::Kanji') {
    ['Kanji', 'Meaning', 'Onyomi', 'Kunyomi', 'Words', 'Sentences'].forEach(k => payload.append(k, formData.value[k]))
  } else if (selectedModel.value === 'JP::Vocabulary') {
    ['Word', 'Meaning', 'Sentences'].forEach(k => payload.append(k, formData.value[k]))
    payload.append('_generateImage', formData.value._generateImage ? 'true' : 'false')
    if (imageFile.value) {
      payload.append('file', imageFile.value)
    }
  } else {
    // Katakana
    ['word', 'meaning', 'sentences', 'image_terms'].forEach(k => payload.append(k, formData.value[k] || ''))
    if (imageFile.value) {
      payload.append('file', imageFile.value)
    }
  }

  try {
    const res = await fetch('http://localhost:3000/api/upload/manual', {
      method: 'POST',
      body: payload
    })
    const data = await res.json()
    
    if (res.status === 409) {
      if (confirm('Essa nota já existe. Deseja atualizar os dados existentes com os novos valores?')) {
        await submitManual(true)
      }
      return
    }
    
    if (!res.ok) throw new Error(data.error || 'Erro ao importar')
    
    statusMessage.value = { type: 'success', text: `Nota importada com sucesso no modelo ${selectedModel.value}!` }
    if (data.fields) {
      openPreviewModal(data.fields)
    }
    clearForm()
  } catch (err: any) {
    statusMessage.value = { type: 'error', text: err.message }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="h-full p-6 overflow-y-auto">
    <div class="max-w-2xl mx-auto space-y-6">
      
      <div class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        <h2 class="text-xl font-bold text-white mb-6">Importação Individual</h2>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
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
        </div>
        
        <form @submit.prevent="submitManual" class="space-y-4">
          <!-- Campos Kanji -->
          <template v-if="selectedModel === 'JP::Kanji'">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Kanji</label>
              <input v-model="formData.Kanji" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Significado</label>
              <input v-model="formData.Meaning" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Onyomi</label>
                <input v-model="formData.Onyomi" type="text" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Kunyomi</label>
                <input v-model="formData.Kunyomi" type="text" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Palavras (Ex: 食[た]べ物[もの]|Comida||食[た]べる|Comer)</label>
              <textarea v-model="formData.Words" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Sentenças (Ex: Sentença1|Significado1||Sentença2|Significado2)</label>
              <textarea v-model="formData.Sentences" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"></textarea>
            </div>
          </template>

          <!-- Campos Vocabulary -->
          <template v-if="selectedModel === 'JP::Vocabulary'">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Palavra (Ex: 食[た]べ物[もの])</label>
              <input v-model="formData.Word" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Significado</label>
              <input v-model="formData.Meaning" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Sentenças (Ex: Sentença1|Significado1||...)</label>
              <textarea v-model="formData.Sentences" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"></textarea>
            </div>
            
            <div class="border border-slate-700 rounded p-4 bg-slate-900/50">
              <label class="block text-sm font-medium text-slate-300 mb-3">Ilustração (Opcional)</label>
              <div class="flex items-center space-x-4">
                <label class="flex items-center space-x-2 cursor-pointer bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded transition-colors text-sm text-white">
                  <ImageIcon class="w-4 h-4" />
                  <span>Upload (JPG, PNG)</span>
                  <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />
                </label>
                <span v-if="imageFile" class="text-sm text-emerald-400 truncate max-w-[150px]">{{ imageFile.name }}</span>
                <span class="text-slate-500">ou</span>
                <label class="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" v-model="formData._generateImage" class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" />
                  <span>✨ Gerar com IA</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Campos Katakana (Legado) -->
          <template v-if="selectedModel === 'JP::Katakana'">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Palavra</label>
              <input v-model="formData.word" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Significado</label>
              <input v-model="formData.meaning" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Termos de Busca de Imagem (Ex: term1|term2)</label>
              <input v-model="formData.image_terms" type="text" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Sentenças (Ex: S1|S2)</label>
              <textarea v-model="formData.sentences" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"></textarea>
            </div>
          </template>

          <div class="pt-4 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span v-if="statusMessage && statusMessage.type === 'success'" class="text-emerald-400 flex items-center space-x-1 text-sm"><CheckCircle class="w-4 h-4"/> <span>{{ statusMessage.text }}</span></span>
              <span v-if="statusMessage && statusMessage.type === 'error'" class="text-red-400 flex items-center space-x-1 text-sm"><XCircle class="w-4 h-4"/> <span>{{ statusMessage.text }}</span></span>
            </div>
            <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <span v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              <Save v-else class="w-4 h-4" />
              <span>Importar Nota</span>
            </button>
          </div>
        </form>
        
      </div>
    </div>
  </div>
</template>
