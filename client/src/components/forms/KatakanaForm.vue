<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Image as ImageIcon } from 'lucide-vue-next';
import ListPreview from '../fields/ListPreview.vue';

interface KatakanaFormData {
    word: string;
    meaning: string;
    image_terms: string;
    sentences: string;
}

const props = defineProps<{
    modelValue: KatakanaFormData;
    maxSentencesCount: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: KatakanaFormData): void;
    (e: 'update:maxSentencesCount', value: number): void;
    (e: 'update:imageFile', value: File | null): void;
}>();

const data = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const imageFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
        imageFile.value = target.files[0];
        emit('update:imageFile', target.files[0]);
    } else {
        imageFile.value = null;
        emit('update:imageFile', null);
    }
};

const handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
            imageFile.value = file;
            emit('update:imageFile', file);
            e.preventDefault();
        }
    }
};

onMounted(() => {
    window.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
    window.removeEventListener('paste', handlePaste);
});

defineExpose({
    clearImage: () => {
        imageFile.value = null;
        if (fileInput.value) fileInput.value.value = '';
        emit('update:imageFile', null);
    }
});
</script>

<template>
    <div class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Palavra</label>
            <input
                v-model="data.word"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
        
        <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Significado</label>
            <input
                v-model="data.meaning"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>

        <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Termos de Busca de Imagem (Ex: term1|term2)</label>
            <input
                v-model="data.image_terms"
                type="text"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>

        <div>
            <label class="block text-sm font-medium text-slate-300 flex items-center space-x-2 mb-1">
                <span>Sentenças</span>
                <input
                    type="number"
                    :value="maxSentencesCount"
                    @input="(e) => emit('update:maxSentencesCount', parseInt((e.target as HTMLInputElement).value) || 5)"
                    min="1"
                    max="10"
                    class="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                    title="Quantidade"
                />
            </label>
            <textarea
                v-model="data.sentences"
                rows="3"
                placeholder="Frase|Tradução||Frase2|Tradução2"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            ></textarea>
            <ListPreview :model-value="data.sentences" title="Preview das Sentenças" />
        </div>

        <div class="border border-slate-700 rounded p-4 bg-slate-900/50">
            <label class="block text-sm font-medium text-slate-300 mb-3">Ilustração (Upload)</label>
            <div class="flex items-center space-x-4">
                <label class="flex items-center space-x-2 cursor-pointer bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded transition-colors text-sm text-white">
                    <ImageIcon class="w-4 h-4" />
                    <span>Upload ou Cole (Ctrl+V)</span>
                    <input
                        type="file"
                        ref="fileInput"
                        class="hidden"
                        accept="image/*"
                        @change="handleFileSelect"
                    />
                </label>
                <span v-if="imageFile" class="text-sm text-emerald-400 truncate max-w-[150px]">{{ imageFile.name }}</span>
            </div>
        </div>
    </div>
</template>
