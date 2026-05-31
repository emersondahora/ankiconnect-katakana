<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Plus, RefreshCw, X } from 'lucide-vue-next'
import { AnkiAPI } from '../api/anki'
import { isAnkiOnline, isBackendOnline } from '../composables/useAnkiStatus'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  allowCreate?: boolean
}>(), {
  allowCreate: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')         // text shown in input
const selectedName = ref(props.modelValue)  // the actual full deck name
const containerRef = ref<HTMLElement | null>(null)
const decks = ref<{ name: string, count: number, label: string, depth: number }[]>([])
const isLoading = ref(false)

// Derive display text: leaf name only, never the full path
const displayValue = computed(() => {
  if (!isOpen.value && selectedName.value) {
    const found = decks.value.find(d => d.name === selectedName.value)
    if (found) return found.label
    // Fallback while decks are still loading: extract leaf from full path
    const parts = selectedName.value.split('::')
    return parts[parts.length - 1]
  }
  return searchQuery.value
})

watch(() => props.modelValue, (newVal) => {
  selectedName.value = newVal
  if (!isOpen.value) {
    searchQuery.value = ''
  }
})

const fetchDecks = async () => {
  isLoading.value = true
  try {
    const res = await AnkiAPI.getDecks()
    decks.value = res.data.map((d: any) => {
      const parts = d.name.split('::')
      const depth = parts.length - 1
      const leafName = parts[depth]
      return {
        name: d.name,
        count: d.count,
        label: `${leafName} (${d.count})`,
        depth
      }
    })
  } catch (e) {
    console.error('Failed to fetch decks', e)
  } finally {
    isLoading.value = false
  }
}

const filteredDecks = computed(() => {
  if (!searchQuery.value) return decks.value
  const lowerQuery = searchQuery.value.toLowerCase()
  return decks.value.filter(d => d.name.toLowerCase().includes(lowerQuery) || d.label.toLowerCase().includes(lowerQuery))
})

const hasExactMatch = computed(() => {
  return decks.value.some(d => d.name.toLowerCase() === searchQuery.value.toLowerCase())
})

const selectDeck = (deckName: string) => {
  selectedName.value = deckName
  searchQuery.value = ''
  emit('update:modelValue', deckName)
  isOpen.value = false
}

const clearSelection = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
  isOpen.value = false
}

const handleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  searchQuery.value = val
  isOpen.value = true
}

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
    searchQuery.value = ''
    // Don't change the selected value on click outside — revert to current selection
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (isBackendOnline.value && isAnkiOnline.value) {
    await fetchDecks()
  }
})

watch([isBackendOnline, isAnkiOnline], async ([backend, anki]) => {
  if (backend && anki && decks.value.length === 0) {
    await fetchDecks()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative w-full" ref="containerRef">
    <div class="relative">
      <input
        type="text"
        :value="isOpen ? searchQuery : displayValue"
        @input="handleInput"
        @focus="isOpen = true; searchQuery = ''"
        class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-16 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        :placeholder="placeholder || 'Select or create deck...'"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
        <div v-if="modelValue && !isLoading" 
             @click.stop="clearSelection" 
             class="p-0.5 rounded cursor-pointer text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
          <X class="w-4 h-4" />
        </div>
        <div 
          @click="!isLoading && (isOpen = !isOpen)"
          :class="isLoading ? 'text-indigo-400' : 'cursor-pointer text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors'">
          <RefreshCw v-if="isLoading" class="w-5 h-5 animate-spin" />
          <ChevronDown v-else class="w-5 h-5 transition-transform" :class="{'rotate-180': isOpen}" />
        </div>
      </div>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-60">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center gap-2 px-3 py-4 text-sm text-slate-400">
        <RefreshCw class="w-4 h-4 animate-spin" />
        <span>Loading decks...</span>
      </div>
      <div v-else class="overflow-y-auto p-1 space-y-1">
        <div 
          v-for="deck in filteredDecks" 
          :key="deck.name"
          @click="selectDeck(deck.name)"
          :style="{ paddingLeft: `${0.75 + deck.depth * 1.25}rem` }"
          class="py-2 pr-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white rounded cursor-pointer"
          :class="{'bg-indigo-600/20 text-indigo-300': modelValue === deck.name}"
        >
          {{ deck.label }}
        </div>
        
        <!-- Create new deck option -->
        <div 
          v-if="searchQuery && !hasExactMatch && allowCreate"
          @click="selectDeck(searchQuery)"
          class="px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer border-t border-slate-700 mt-1 flex items-center space-x-2"
        >
          <Plus class="w-4 h-4" />
          <span class="truncate">Create new deck: <strong>{{ searchQuery }}</strong></span>
        </div>
        
        <div v-if="filteredDecks.length === 0 && !searchQuery" class="px-3 py-3 text-sm text-slate-500 text-center">
          No decks found.
        </div>
      </div>
    </div>
  </div>
</template>
