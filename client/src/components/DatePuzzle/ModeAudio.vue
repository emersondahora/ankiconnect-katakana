<template>
  <div class="flex flex-col items-center">
    <div class="mb-4 text-center">
      <h2 class="text-xl font-semibold text-slate-200 mb-2">Listen and Guess</h2>
      <p class="text-sm text-slate-400">Listen to the audio and select the correct date.</p>
    </div>

    <button 
      @click="puzzleState.playAudioSequence()"
      class="mb-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-3 hover:scale-105"
    >
      <Volume2Icon class="w-6 h-6" /> Play Audio
    </button>

    <div class="w-full bg-slate-800/80 p-6 rounded-xl border border-slate-700">
      <h3 class="text-center text-sm font-medium text-slate-300 mb-4">Your Answer</h3>
      <DateSelector 
        v-model:year="guessYear"
        v-model:month="guessMonth"
        v-model:day="guessDay"
      />
    </div>

    <div class="w-full mt-8" v-if="!showAnswer">
      <button 
        @click="checkAnswer"
        class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold tracking-wide shadow-lg shadow-indigo-600/20 transition-all"
      >
        Check Answer
      </button>
    </div>

    <div v-else class="w-full mt-8 flex flex-col items-center gap-6">
      <div :class="['w-full p-6 rounded-xl border text-center', isCorrect ? 'bg-green-600/10 border-green-600/50 text-green-400' : 'bg-red-600/10 border-red-600/50 text-red-400']">
        <div class="flex items-center justify-center gap-2 mb-2 text-xl font-bold">
          <CheckCircleIcon v-if="isCorrect" class="w-6 h-6" />
          <XCircleIcon v-else class="w-6 h-6" />
          {{ isCorrect ? 'Correct!' : 'Incorrect!' }}
        </div>
        
        <div class="mt-4 pt-4 border-t border-current/20">
          <p class="text-sm text-slate-400 mb-1">Correct Answer:</p>
          <div class="text-2xl font-japanese font-bold text-slate-100 mb-1">
            {{ targetYear }}年{{ String(targetMonth).padStart(2, '0') }}月{{ String(targetDay).padStart(2, '0') }}日
          </div>
          <div class="text-lg font-japanese text-indigo-400">
            {{ puzzleState.readingHiragana }}
          </div>
        </div>
      </div>

      <button 
        @click="nextRound"
        class="px-8 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
      >
        Next Round <ArrowRightIcon class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Volume2Icon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from 'lucide-vue-next';
import DateSelector from './DateSelector.vue';
import type { useDatePuzzle } from '../../composables/useDatePuzzle';

const props = defineProps<{
    puzzleState: ReturnType<typeof useDatePuzzle>
}>();

const { targetYear, targetMonth, targetDay, generateRandomDate, registerAttempt } = props.puzzleState;

const guessYear = ref(1980);
const guessMonth = ref(1);
const guessDay = ref(1);

const showAnswer = ref(false);
const isCorrect = ref(false);

const checkAnswer = () => {
    isCorrect.value = 
        guessYear.value === targetYear.value && 
        guessMonth.value === targetMonth.value && 
        guessDay.value === targetDay.value;
        
    registerAttempt(isCorrect.value);
    showAnswer.value = true;
};

const nextRound = () => {
    generateRandomDate();
    // Keep user's last guess or reset? Let's keep it as is, or maybe reset to target? 
    // Usually it's better to reset to some default or let it be.
    showAnswer.value = false;
};

// Reset state if mode changes or random date is generated externally
watch([targetYear, targetMonth, targetDay], () => {
    showAnswer.value = false;
});
</script>
