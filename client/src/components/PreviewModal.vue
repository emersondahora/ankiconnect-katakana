<script setup lang="ts">
import AnkiPreview from './AnkiPreview.vue'
import { isModalOpen, currentPreviewFields, currentPreviewModel, closePreviewModal } from '../composables/usePreviewMode'
</script>

<template>
  <div v-if="isModalOpen && currentPreviewFields" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
    <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" @click="closePreviewModal"></div>
    
    <div class="relative w-full max-w-4xl h-[90vh] min-w-[300px] min-h-[300px] flex flex-col bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/10 transform transition-all resize overflow-auto">
      <AnkiPreview :fields="currentPreviewFields" :modelName="currentPreviewModel" class="w-full h-full border-0 shadow-none rounded-none" />
    </div>
  </div>
</template>
