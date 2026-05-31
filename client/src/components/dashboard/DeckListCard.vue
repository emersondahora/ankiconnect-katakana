<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Layers, ChevronRight, ChevronDown, ExternalLink } from 'lucide-vue-next'
import { isAnkiOnline, isBackendOnline } from '../../composables/useAnkiStatus'
import { AnkiAPI } from '../../api/anki'
import { useCache } from '../../composables/useCache'

interface DeckNode {
  name: string
  count: number
  label: string
  depth: number
  children: DeckNode[]
}

interface FlatRow {
  node: DeckNode
  visible: boolean
}

const router = useRouter()
const isLoading = ref(false)
const rawDecks = ref<{ name: string; count: number }[]>([])
const expanded = ref(new Set<string>())

// Build tree from flat sorted list
const tree = computed<DeckNode[]>(() => {
  const nodes: DeckNode[] = rawDecks.value.map(d => {
    const parts = d.name.split('::')
    return { name: d.name, count: d.count, label: parts[parts.length - 1], depth: parts.length - 1, children: [] }
  })
  const byName = new Map(nodes.map(n => [n.name, n]))
  const roots: DeckNode[] = []
  for (const node of nodes) {
    const parts = node.name.split('::')
    if (parts.length === 1) {
      roots.push(node)
    } else {
      const parent = byName.get(parts.slice(0, -1).join('::'))
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
  }
  return roots
})

// Flatten visible nodes based on expanded state
const flatRows = computed<FlatRow[]>(() => {
  const rows: FlatRow[] = []
  const walk = (nodes: DeckNode[], parentVisible: boolean) => {
    for (const node of nodes) {
      const visible = parentVisible
      rows.push({ node, visible })
      if (node.children.length > 0) {
        walk(node.children, visible && expanded.value.has(node.name))
      }
    }
  }
  walk(tree.value, true)
  return rows
})

const fetchDecks = async () => {
  isLoading.value = true
  try {
    const res = await AnkiAPI.getDecks()
    rawDecks.value = res.data
    // Auto-expand root decks
    for (const d of res.data as { name: string; count: number }[]) {
      if (!d.name.includes('::')) expanded.value.add(d.name)
    }
    expanded.value = new Set(expanded.value)
  } catch (e) {
    console.error('Failed to fetch decks', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (isBackendOnline.value && isAnkiOnline.value) await fetchDecks()
})

watch([isBackendOnline, isAnkiOnline], async ([backend, anki]) => {
  if (backend && anki && rawDecks.value.length === 0) await fetchDecks()
})

const toggleExpand = (name: string) => {
  if (expanded.value.has(name)) expanded.value.delete(name)
  else expanded.value.add(name)
  expanded.value = new Set(expanded.value)
}

const goToDeck = (deckName: string) => {
  const selectedDeck = useCache('selected-deck', '')
  selectedDeck.value = deckName
  router.push('/browser')
}
</script>

<template>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg h-full flex flex-col">
    <div class="flex items-center justify-between mb-5 shrink-0">
      <h3 class="text-slate-300 font-semibold">Your Decks</h3>
      <Layers class="w-5 h-5 text-emerald-400" />
    </div>

    <div v-if="!isBackendOnline || !isAnkiOnline"
         class="flex-1 flex items-center justify-center text-slate-500 p-6 border-2 border-dashed border-slate-700 rounded-lg text-sm">
      System must be online to view decks.
    </div>
    <div v-else-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
    <div v-else-if="flatRows.length === 0"
         class="flex-1 flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">
      No decks found in Anki.
    </div>

    <div v-else class="flex-1 overflow-y-auto space-y-1 pr-1">
      <template v-for="{ node, visible } in flatRows" :key="node.name">
        <div
          v-show="visible"
          :class="[
            'group flex items-center rounded-lg border transition-all duration-150 overflow-hidden',
            node.depth === 0
              ? 'bg-slate-900 border-slate-700 hover:border-indigo-500/50'
              : node.depth === 1
                ? 'bg-slate-800 border-slate-700/60 hover:border-indigo-500/40'
                : 'bg-slate-800/70 border-slate-700/40 hover:border-indigo-500/30',
          ]"
          :style="{ marginLeft: `${node.depth * 1.25}rem` }"
        >
          <!-- Depth indicator bar for children -->
          <div
            v-if="node.depth > 0"
            class="shrink-0 w-0.5 self-stretch"
            :class="node.depth === 1 ? 'bg-indigo-500/60' : 'bg-purple-500/50'"
          />

          <!-- Main clickable area: navigate to deck -->
          <button
            @click="goToDeck(node.name)"
            class="flex-1 flex items-center px-3 py-2.5 text-left transition-colors min-w-0"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium leading-tight truncate"
                 :class="node.depth === 0 ? 'text-white' : node.depth === 1 ? 'text-slate-100' : 'text-slate-200'">
                {{ node.label }}
              </p>
              <p class="text-xs mt-0.5"
                 :class="node.depth === 0 ? 'text-slate-400' : 'text-slate-500'">
                {{ node.count }} notes
              </p>
            </div>
          </button>

          <!-- Right-side actions -->
          <div class="flex items-center shrink-0 pr-2 gap-1">
            <!-- Expand/collapse toggle (only when has children) -->
            <button
              v-if="node.children.length > 0"
              @click.stop="toggleExpand(node.name)"
              class="p-1.5 rounded-md transition-colors text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
              :title="expanded.has(node.name) ? 'Collapse' : 'Expand'"
            >
              <ChevronDown v-if="expanded.has(node.name)" class="w-4 h-4" />
              <ChevronRight v-else class="w-4 h-4" />
            </button>

            <!-- Navigate hint -->
            <ExternalLink
              class="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

