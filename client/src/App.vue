<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { LayoutDashboard, UploadCloud, Library } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { isAnkiOnline, isBackendOnline, checkStatus } from './composables/useAnkiStatus'
import PreviewModal from './components/PreviewModal.vue'

const route = useRoute()

onMounted(() => {
  checkStatus()
  setInterval(checkStatus, 5000)
})
</script>

<template>
  <div class="flex h-screen bg-slate-900 text-slate-50 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div class="p-6">
        <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Anki Creator
        </h1>
      </div>

      <nav class="flex-1 px-4 space-y-2">
        <RouterLink to="/" 
          class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
          :class="route.path === '/' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'">
          <LayoutDashboard class="w-5 h-5" />
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink to="/import/bulk" 
          class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
          :class="route.path === '/import/bulk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'">
          <UploadCloud class="w-5 h-5" />
          <span>Bulk Import</span>
        </RouterLink>

        <RouterLink to="/browser" 
          class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
          :class="route.path === '/browser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'">
          <Library class="w-5 h-5" />
          <span>Deck Browser</span>
        </RouterLink>
      </nav>

      <!-- Status Indicator -->
      <div class="p-4 border-t border-slate-700">
        <div class="flex items-center space-x-2 text-sm">
          <div class="relative flex h-3 w-3">
            <span v-if="isBackendOnline && isAnkiOnline" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3" :class="isBackendOnline && isAnkiOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
          </div>
          <span class="text-slate-400 truncate flex-1">
            <template v-if="!isBackendOnline">API Offline</template>
            <template v-else-if="!isAnkiOnline">Anki Offline</template>
            <template v-else>Anki Connected</template>
          </span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden flex flex-col relative z-0">
      <RouterView />
    </main>

    <PreviewModal />
  </div>
</template>
