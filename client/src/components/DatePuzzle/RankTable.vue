<template>
  <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
    <div class="bg-slate-900/50 p-4 border-b border-slate-700">
      <h3 class="font-bold text-slate-200">{{ title }}</h3>
    </div>
    <div class="overflow-y-auto max-h-64 p-2">
      <table class="w-full text-sm text-left">
        <thead class="text-xs text-slate-400 uppercase bg-slate-800 sticky top-0">
          <tr>
            <th class="px-3 py-2 rounded-tl-lg">Item</th>
            <th class="px-3 py-2 text-center text-green-500"><CheckCircleIcon class="w-4 h-4 inline" /></th>
            <th class="px-3 py-2 text-center text-red-500"><XCircleIcon class="w-4 h-4 inline" /></th>
            <th class="px-3 py-2 text-right rounded-tr-lg">%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="stats.length === 0">
            <td colspan="4" class="px-3 py-6 text-center text-slate-500">No data</td>
          </tr>
          <tr v-for="row in stats" :key="row.val" class="border-b border-slate-700/50 hover:bg-slate-700/20 last:border-0">
            <td class="px-3 py-2 font-medium text-slate-300">
              <span class="font-japanese">{{ row.val }}{{ unit }}</span>
            </td>
            <td class="px-3 py-2 text-center text-green-400/80">{{ row.correct }}</td>
            <td class="px-3 py-2 text-center text-red-400/80">{{ row.incorrect }}</td>
            <td class="px-3 py-2 text-right font-medium" :class="row.acc >= 80 ? 'text-green-500' : (row.acc >= 50 ? 'text-yellow-500' : 'text-red-500')">
              {{ row.acc }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon } from 'lucide-vue-next';

interface StatRow {
    val: number;
    correct: number;
    incorrect: number;
    total: number;
    acc: number;
}

const props = defineProps<{
    title: string;
    unit: string;
    stats: StatRow[];
}>();
</script>
