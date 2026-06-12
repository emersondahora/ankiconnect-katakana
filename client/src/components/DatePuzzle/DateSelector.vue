<template>
  <div class="flex flex-wrap gap-4 items-end justify-center mb-8">
    <div class="flex flex-col gap-1">
      <label class="text-xs text-slate-400 font-medium tracking-wider">Year</label>
      <div class="flex items-center gap-2">
        <select 
          v-model="internalYear"
          class="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors"
        >
          <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
        </select>
        <span class="text-2xl font-japanese text-indigo-500 cursor-pointer hover:text-indigo-400" @click="randomizeYear">年</span>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs text-slate-400 font-medium tracking-wider">Month</label>
      <div class="flex items-center gap-2">
        <select 
          v-model="internalMonth"
          class="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors"
        >
          <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
        </select>
        <span class="text-2xl font-japanese text-indigo-500 cursor-pointer hover:text-indigo-400" @click="randomizeMonth">月</span>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs text-slate-400 font-medium tracking-wider">Day</label>
      <div class="flex items-center gap-2">
        <select 
          v-model="internalDay"
          class="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors"
        >
          <option v-for="d in daysInMonth" :key="d" :value="d">{{ String(d).padStart(2, '0') }}</option>
        </select>
        <span class="text-2xl font-japanese text-rose-500 cursor-pointer hover:text-rose-400" @click="randomizeDay">日</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    year: number;
    month: number;
    day: number;
}>();

const emit = defineEmits<{
    (e: 'update:year', val: number): void;
    (e: 'update:month', val: number): void;
    (e: 'update:day', val: number): void;
}>();

const internalYear = ref(props.year);
const internalMonth = ref(props.month);
const internalDay = ref(props.day);

watch(() => props.year, (v) => internalYear.value = v);
watch(() => props.month, (v) => internalMonth.value = v);
watch(() => props.day, (v) => internalDay.value = v);

watch(internalYear, (v) => { emit('update:year', v); adjustDay(); });
watch(internalMonth, (v) => { emit('update:month', v); adjustDay(); });
watch(internalDay, (v) => emit('update:day', v));

const yearsList = computed(() => {
    const list = [];
    for (let y = 1980; y <= 2026; y++) list.push(y);
    return list;
});

const daysInMonth = computed(() => {
    return new Date(internalYear.value, internalMonth.value, 0).getDate();
});

const adjustDay = () => {
    const maxDay = daysInMonth.value;
    if (internalDay.value > maxDay) {
        internalDay.value = maxDay;
    }
};

const randomizeYear = () => {
    internalYear.value = Math.floor(Math.random() * (2026 - 1980 + 1)) + 1980;
};
const randomizeMonth = () => {
    internalMonth.value = Math.floor(Math.random() * 12) + 1;
};
const randomizeDay = () => {
    internalDay.value = Math.floor(Math.random() * daysInMonth.value) + 1;
};
</script>
