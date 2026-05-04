<script setup lang="ts">
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import { isAnkiOnline, isBackendOnline } from '../composables/useAnkiStatus'
</script>

<template>
  <div class="p-8 h-full overflow-y-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-white">Welcome back!</h2>
      <p class="text-slate-400 mt-2">Ready to create some beautiful Anki cards today?</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Stats Card -->
      <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-slate-400 font-medium">Quick Actions</h3>
          <UploadCloud class="w-5 h-5 text-indigo-400" />
        </div>
        <router-link to="/import/bulk" class="block w-full text-center bg-indigo-600 hover:bg-indigo-500 transition-colors text-white py-3 rounded-lg font-medium">
          Start Bulk Import
        </router-link>
      </div>

      <!-- Stats Card -->
      <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg" :class="{'border-red-500/50': !isBackendOnline || !isAnkiOnline}">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-slate-400 font-medium">System Status</h3>
          <CheckCircle v-if="isBackendOnline && isAnkiOnline" class="w-5 h-5 text-emerald-400" />
          <AlertTriangle v-else class="w-5 h-5 text-red-400" />
        </div>
        <p class="text-2xl font-semibold text-white">
          <template v-if="!isBackendOnline">API Offline</template>
          <template v-else-if="!isAnkiOnline">Anki Offline</template>
          <template v-else>All systems operational</template>
        </p>
        <p class="text-sm mt-1" :class="isBackendOnline && isAnkiOnline ? 'text-slate-400' : 'text-red-400/80'">
          <template v-if="!isBackendOnline">Start the node server (npm run dev)</template>
          <template v-else-if="!isAnkiOnline">Please open Anki Desktop</template>
          <template v-else>Ready for importing</template>
        </p>
      </div>
    </div>
  </div>
</template>
