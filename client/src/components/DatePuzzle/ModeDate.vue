<template>
  <div class="flex flex-col items-center">
    <div class="mb-4 text-center">
      <h2 class="text-xl font-semibold text-slate-200 mb-2">Read the Date</h2>
      <p class="text-sm text-slate-400">Try to read the date below. You can randomize individual parts by clicking the Japanese character, or randomize all at once.</p>
    </div>

    <DateSelector 
      v-model:year="targetYear"
      v-model:month="targetMonth"
      v-model:day="targetDay"
    />

    <button 
      @click="randomizeAll"
      class="mb-8 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors text-sm font-medium flex items-center gap-2"
    >
      <DicesIcon class="w-4 h-4" /> Randomize All
    </button>

    <div class="flex gap-4 mb-8">
      <button 
        @click="showReading = !showReading"
        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
      >
        <EyeIcon class="w-5 h-5" /> {{ showReading ? 'Hide Reading' : 'Reveal Reading' }}
      </button>

      <button 
        @click="puzzleState.playAudioSequence()"
        class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
      >
        <Volume2Icon class="w-5 h-5" /> Play Audio
      </button>
    </div>

    <div v-if="showReading" class="mb-8 p-4 bg-slate-800 border border-slate-700 rounded-lg text-center min-w-[300px]">
      <div class="text-3xl font-japanese text-indigo-400 mb-2">{{ puzzleState.readingHiragana }}</div>
      <div class="text-sm text-slate-500">Hiragana Reading</div>
    </div>

    <div class="w-full border-t border-slate-700/50 pt-8 mt-4">
      <p class="text-center text-sm text-slate-400 mb-4">Did you get it right?</p>
      <div class="flex justify-center gap-4">
        <button 
          @click="handleResult(true)"
          class="px-6 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-600/50 rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <CheckCircleIcon class="w-5 h-5" /> Correct
        </button>
        <button 
          @click="handleResult(false)"
          class="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/50 rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <XCircleIcon class="w-5 h-5" /> Incorrect
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EyeIcon, Volume2Icon, CheckCircleIcon, XCircleIcon, DicesIcon } from 'lucide-vue-next';
import DateSelector from './DateSelector.vue';
import type { useDatePuzzle } from '../../composables/useDatePuzzle';

const props = defineProps<{
    puzzleState: ReturnType<typeof useDatePuzzle>
}>();

const { targetYear, targetMonth, targetDay, generateRandomDate, registerAttempt } = props.puzzleState;
const showReading = ref(false);

const randomizeAll = () => {
    generateRandomDate();
    showReading.value = false;
};

const handleResult = (correct: boolean) => {
    registerAttempt(correct);
    randomizeAll();
};
</script>
