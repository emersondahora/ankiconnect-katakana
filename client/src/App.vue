<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { LayoutDashboard, UploadCloud, FilePlus, Library, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { isAnkiOnline, isBackendOnline, checkStatus } from './composables/useAnkiStatus'
import { useCache } from './composables/useCache'
import PreviewModal from './components/PreviewModal.vue'

const route = useRoute()
const isSidebarCollapsed = useCache('sidebar-collapsed', false)

onMounted(() => {
  checkStatus()
  setInterval(checkStatus, 5000)
})
</script>

<template>
  <div class="flex h-screen bg-slate-900 text-slate-50 font-sans">
    <!-- Sidebar -->
    <aside
      class="bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 transition-all duration-300"
      :class="isSidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo / Title -->
      <div class="p-4 flex items-center justify-between border-b border-slate-700/60 shrink-0 h-16">
        <h1
          v-if="!isSidebarCollapsed"
          class="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent truncate"
        >
          Anki Creator (2.0)
        </h1>
        <button
          @click="isSidebarCollapsed = !isSidebarCollapsed"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          :class="isSidebarCollapsed ? 'mx-auto' : ''"
          :title="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <ChevronLeft v-if="!isSidebarCollapsed" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- Nav Links -->
      <nav class="flex-1 px-2 py-4 space-y-1">
        <RouterLink to="/"
          class="flex items-center rounded-lg transition-colors px-3 py-3"
          :class="[
            route.path === '/' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white',
            isSidebarCollapsed ? 'justify-center' : 'space-x-3'
          ]"
          :title="isSidebarCollapsed ? 'Dashboard' : ''"
        >
          <LayoutDashboard class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed">Dashboard</span>
        </RouterLink>

        <RouterLink to="/import/bulk"
          class="flex items-center rounded-lg transition-colors px-3 py-3"
          :class="[
            route.path === '/import/bulk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white',
            isSidebarCollapsed ? 'justify-center' : 'space-x-3'
          ]"
          :title="isSidebarCollapsed ? 'Bulk Import' : ''"
        >
          <UploadCloud class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed">Bulk Import</span>
        </RouterLink>

        <RouterLink to="/import/manual"
          class="flex items-center rounded-lg transition-colors px-3 py-3"
          :class="[
            route.path === '/import/manual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white',
            isSidebarCollapsed ? 'justify-center' : 'space-x-3'
          ]"
          :title="isSidebarCollapsed ? 'Manual Import' : ''"
        >
          <FilePlus class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed">Manual Import</span>
        </RouterLink>

        <RouterLink to="/browser"
          class="flex items-center rounded-lg transition-colors px-3 py-3"
          :class="[
            route.path === '/browser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white',
            isSidebarCollapsed ? 'justify-center' : 'space-x-3'
          ]"
          :title="isSidebarCollapsed ? 'Deck Browser' : ''"
        >
          <Library class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed">Deck Browser</span>
        </RouterLink>
      </nav>

      <!-- Status Indicator -->
      <div class="p-4 border-t border-slate-700 shrink-0">
        <div class="flex items-center" :class="isSidebarCollapsed ? 'justify-center' : 'space-x-2'">
          <div class="relative flex h-3 w-3 shrink-0">
            <span v-if="isBackendOnline && isAnkiOnline" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3" :class="isBackendOnline && isAnkiOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
          </div>
          <span v-if="!isSidebarCollapsed" class="text-slate-400 text-sm truncate flex-1">
            <template v-if="!isBackendOnline">API Offline</template>
            <template v-else-if="!isAnkiOnline">Anki Offline</template>
            <template v-else>Anki Connected</template>
          </span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden flex flex-col relative z-0 min-w-0">
      <RouterView />
    </main>

    <PreviewModal />
  </div>
</template>
