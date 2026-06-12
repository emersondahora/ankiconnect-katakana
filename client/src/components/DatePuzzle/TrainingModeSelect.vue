<template>
  <div class="flex gap-4 p-1 bg-slate-800 rounded-lg w-max mb-6">
    <button 
      @click="updateMode('date')"
      :class="['px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2', modelValue === 'date' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200']"
    >
      <CalendarIcon class="w-4 h-4" /> Date Mode
    </button>
    <button 
      @click="updateMode('audio')"
      :class="['px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2', modelValue === 'audio' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200']"
    >
      <Volume2Icon class="w-4 h-4" /> Audio Mode
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
