<script setup lang="ts">
import { UploadCloud } from 'lucide-vue-next'
</script>

<template>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-slate-400 font-medium">Quick Actions</h3>
      <UploadCloud class="w-5 h-5 text-indigo-400" />
    </div>
    <router-link
      to="/import/bulk"
      class="block w-full text-center bg-indigo-600 hover:bg-indigo-500 transition-colors text-white py-3 rounded-lg font-medium"
    >
      Start Bulk Import
    </router-link>
  </div>
</template>
