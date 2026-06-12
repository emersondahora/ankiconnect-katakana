<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap gap-4 items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
      <div class="flex items-center gap-4">
        <div class="flex flex-col">
          <label class="text-xs text-slate-400 mb-1">Mode Filter</label>
          <select v-model="filterMode" class="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm outline-none">
            <option value="all">All Modes</option>
            <option value="date">Date Mode</option>
            <option value="audio">Audio Mode</option>
          </select>
        </div>
        <div class="flex flex-col">
          <label class="text-xs text-slate-400 mb-1">Recent Attempts</label>
          <select v-model="filterLimit" class="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm outline-none">
            <option :value="0">All History</option>
            <option :value="10">Last 10</option>
            <option :value="50">Last 50</option>
            <option :value="100">Last 100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Accuracy Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
        <div class="text-slate-400 text-sm mb-2">Total Attempts</div>
        <div class="text-4xl font-bold text-slate-100">{{ filteredHistory.length }}</div>
      </div>
      
      <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
        <div class="text-slate-400 text-sm mb-2">Accuracy</div>
        <div :class="['text-4xl font-bold', accuracyColor]">{{ accuracyPercentage }}%</div>
        <div class="text-xs text-slate-500 mt-2">{{ correctCount }} Hits / {{ incorrectCount }} Misses</div>
      </div>
      
      <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
        <div class="text-slate-400 text-sm mb-2">Performance</div>
        <div :class="['text-xl font-bold', accuracyColor]">{{ performanceLabel }}</div>
      </div>
    </div>

    <!-- Ranking Tables -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <RankTable title="Years" :stats="yearStats" unit="年" />
      <RankTable title="Months" :stats="monthStats" unit="月" />
      <RankTable title="Days" :stats="dayStats" unit="日" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PuzzleResult } from '../../composables/useDatePuzzle';
import RankTable from './RankTable.vue';

const props = defineProps<{
    history: PuzzleResult[]
}>();

const filterMode = ref<'all' | 'date' | 'audio'>('all');
const filterLimit = ref<number>(0);

const filteredHistory = computed(() => {
    let result = props.history;
    if (filterMode.value !== 'all') {
        result = result.filter(h => h.mode === filterMode.value);
    }
    // Sort by timestamp desc to get recent, then slice
    result = [...result].sort((a, b) => b.timestamp - a.timestamp);
    
    if (filterLimit.value > 0) {
        result = result.slice(0, filterLimit.value);
    }
    return result;
});

const correctCount = computed(() => filteredHistory.value.filter(h => h.correct).length);
const incorrectCount = computed(() => filteredHistory.value.length - correctCount.value);

const accuracyPercentage = computed(() => {
    if (filteredHistory.value.length === 0) return 0;
    return Math.round((correctCount.value / filteredHistory.value.length) * 100);
});

const accuracyColor = computed(() => {
    const acc = accuracyPercentage.value;
    if (filteredHistory.value.length === 0) return 'text-neutral-400';
    if (acc >= 80) return 'text-green-500';
    if (acc >= 50) return 'text-yellow-500';
    return 'text-red-500';
});

const performanceLabel = computed(() => {
    const acc = accuracyPercentage.value;
    if (filteredHistory.value.length === 0) return 'No Data';
    if (acc >= 90) return 'Master (S)';
    if (acc >= 80) return 'Excellent (A)';
    if (acc >= 60) return 'Good (B)';
    if (acc >= 40) return 'Learning (C)';
    return 'Needs Practice (D)';
});

// Stats aggregation
const buildStats = (key: 'year' | 'month' | 'day') => {
    const stats: Record<number, { val: number, correct: number, incorrect: number, total: number }> = {};
    filteredHistory.value.forEach(h => {
        const val = h[key];
        if (!stats[val]) stats[val] = { val, correct: 0, incorrect: 0, total: 0 };
        stats[val].total++;
        if (h.correct) stats[val].correct++;
        else stats[val].incorrect++;
    });
    return Object.values(stats).map(s => ({
        ...s,
        acc: Math.round((s.correct / s.total) * 100)
    })).sort((a, b) => b.total - a.total); // Sort by most encountered
};

const yearStats = computed(() => buildStats('year'));
const monthStats = computed(() => buildStats('month'));
const dayStats = computed(() => buildStats('day'));

</script>
