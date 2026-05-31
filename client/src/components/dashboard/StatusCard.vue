<script setup lang="ts">
import { CheckCircle, AlertTriangle } from 'lucide-vue-next'
import { isAnkiOnline, isBackendOnline } from '../../composables/useAnkiStatus'
</script>

<template>
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
</template>
