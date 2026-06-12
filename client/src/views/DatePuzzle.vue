<template>
  <div class="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
    <header class="mb-10 text-center">
      <h1 class="text-4xl font-bold tracking-wider text-indigo-500 mb-2">日付パズル</h1>
      <p class="text-slate-400">Date Puzzle - Master Japanese Dates</p>
    </header>

    <div class="w-full max-w-4xl bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
      <div class="flex gap-4 mb-6 border-b border-slate-700 pb-4">
        <button 
          @click="currentTab = 'play'" 
          :class="['px-4 py-2 rounded-lg font-medium transition-all', currentTab === 'play' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
        >
          🎮 Play
        </button>
        <button 
          @click="currentTab = 'dashboard'" 
          :class="['px-4 py-2 rounded-lg font-medium transition-all', currentTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
        >
          📊 Dashboard
        </button>
      </div>

      <div v-if="currentTab === 'play'">
        <TrainingModeSelect v-model="mode" @change="handleModeChange" />
        
        <div class="mt-6 flex flex-col md:flex-row items-center justify-center md:justify-end gap-4">
          <div class="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
             <label for="speed-slider" class="text-sm text-slate-400 font-medium whitespace-nowrap">
               Speed: <span class="text-indigo-400 w-10 inline-block text-right">{{ Number(audioSpeed).toFixed(2) }}x</span>
             </label>
             <input id="speed-slider" type="range" min="0.5" max="2" step="0.05" v-model.number="audioSpeed" class="w-32 accent-indigo-500" />
          </div>
        </div>

        <div class="mt-6 p-6 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <ModeDate v-if="mode === 'date'" :puzzleState="puzzleState" />
          <ModeAudio v-else :puzzleState="puzzleState" />
        </div>
      </div>

      <div v-else>
        <DashboardReport :history="history" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDatePuzzle } from '../composables/useDatePuzzle';
import TrainingModeSelect from '../components/DatePuzzle/TrainingModeSelect.vue';
import ModeDate from '../components/DatePuzzle/ModeDate.vue';
import ModeAudio from '../components/DatePuzzle/ModeAudio.vue';
import DashboardReport from '../components/DatePuzzle/DashboardReport.vue';

const currentTab = ref<'play' | 'dashboard'>('play');
const puzzleState = useDatePuzzle();
const { mode, generateRandomDate, registerAccess, history, audioSpeed } = puzzleState;

const handleModeChange = () => {
    generateRandomDate();
};

onMounted(() => {
    registerAccess();
});
</script>
