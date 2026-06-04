<script setup lang="ts">
import { computed } from 'vue';
import { Table } from 'lucide-vue-next';

const props = defineProps<{
    modelValue: string; // O texto bruto. ex: Palavra|Significado||Palavra2|Significado2
    title?: string;
}>();

const parsedItems = computed(() => {
    if (!props.modelValue || !props.modelValue.trim()) return [];
    
    const lines = props.modelValue.split('||').filter(Boolean);
    return lines.map(line => {
        const parts = line.split('|');
        return {
            primary: parts[0]?.trim() || '',
            secondary: parts[1]?.trim() || ''
        };
    });
});
</script>

<template>
    <div v-if="parsedItems.length > 0" class="mt-2 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
        <div v-if="title" class="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center space-x-2">
            <Table class="w-4 h-4 text-indigo-400" />
            <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{{ title }}</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-slate-300">
                <tbody>
                    <tr v-for="(item, index) in parsedItems" :key="index" class="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                        <td class="px-4 py-2 font-medium text-white align-top w-1/3">
                            {{ item.primary }}
                        </td>
                        <td class="px-4 py-2 text-slate-400 align-top">
                            {{ item.secondary }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
