<template>
  <div class="flex w-full sm:w-max p-1 bg-slate-800 rounded-lg mb-6">
    <button 
      @click="updateMode('date')"
      :class="['flex-1 sm:flex-none px-2 sm:px-6 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base', modelValue === 'date' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200']"
    >
      <CalendarIcon class="w-4 h-4 shrink-0" /> <span class="truncate">Date Mode</span>
    </button>
    <button 
      @click="updateMode('audio')"
      :class="['flex-1 sm:flex-none px-2 sm:px-6 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base', modelValue === 'audio' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200']"
    >
      <Volume2Icon class="w-4 h-4 shrink-0" /> <span class="truncate">Audio Mode</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { CalendarIcon, Volume2Icon } from 'lucide-vue-next';
import type { GameMode } from '../../composables/useDatePuzzle';

const props = defineProps<{
    modelValue: GameMode
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: GameMode): void;
    (e: 'change'): void;
}>();

const updateMode = (val: GameMode) => {
    emit('update:modelValue', val);
    emit('change');
};
</script>
