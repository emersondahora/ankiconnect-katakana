<script setup lang="ts">
import { ref } from 'vue';
import { Sparkles, Loader2 } from 'lucide-vue-next';
import { apiClient } from "../../api/client";

const props = defineProps<{
    modelValue: string;
    label: string;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    // Config para IA
    promptType?: string;
    dependsOn?: string; 
    canGenerate?: boolean;
    maxCount?: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'error', message: string): void;
    (e: 'update:maxCount', value: number): void;
}>();

const isGenerating = ref(false);

const generate = async () => {
    if (!props.promptType || !props.canGenerate) return;
    
    isGenerating.value = true;
    try {
        const res = await apiClient.post("/generate", {
            type: props.promptType,
            item: props.dependsOn,
            maxCount: props.maxCount
        });
        
        emit('update:modelValue', res.data.result);
    } catch (err: any) {
        const msg = err.response?.data?.error || err.message || "Erro ao gerar campo";
        emit('error', msg);
    } finally {
        isGenerating.value = false;
    }
};
</script>

<template>
    <div>
        <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium text-slate-300 flex items-center space-x-2">
                <span>{{ label }}</span>
                <input
                    v-if="maxCount !== undefined"
                    type="number"
                    :value="maxCount"
                    @input="(e) => emit('update:maxCount', parseInt((e.target as HTMLInputElement).value) || 5)"
                    min="1"
                    max="20"
                    class="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    title="Quantidade"
                />
            </label>
            <button
                v-if="promptType"
                type="button"
                @click="generate"
                :disabled="!canGenerate || isGenerating"
                class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                title="Gerar com IA"
            >
                <Loader2 v-if="isGenerating" class="w-4 h-4 animate-spin" />
                <Sparkles v-else class="w-4 h-4" />
            </button>
        </div>
        <textarea
            :value="modelValue"
            @input="(e) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
            :rows="rows || 3"
            :required="required"
            :placeholder="placeholder"
            class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
        ></textarea>
    </div>
</template>
