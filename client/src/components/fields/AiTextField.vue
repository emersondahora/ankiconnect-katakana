<script setup lang="ts">
import { ref } from 'vue';
import { Sparkles, Loader2, AlertCircle } from 'lucide-vue-next';
import { apiClient } from "../../api/client";

const props = defineProps<{
    modelValue: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    type?: string; // e.g., 'text'
    // Config para IA
    promptType?: string;
    dependsOn?: string; 
    canGenerate?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'error', message: string): void;
}>();

const isGenerating = ref(false);

const generate = async () => {
    if (!props.promptType || !props.canGenerate) return;
    
    isGenerating.value = true;
    try {
        const res = await apiClient.post("/generate", {
            type: props.promptType,
            item: props.dependsOn,
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
            <label class="block text-sm font-medium text-slate-300">
                {{ label }}
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
        <input
            :type="type || 'text'"
            :value="modelValue"
            @input="(e) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
            :required="required"
            :placeholder="placeholder"
            class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
    </div>
</template>
