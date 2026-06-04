<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Image as ImageIcon } from 'lucide-vue-next';
import AiTextField from '../fields/AiTextField.vue';
import AiTextareaField from '../fields/AiTextareaField.vue';
import ListPreview from '../fields/ListPreview.vue';

interface VocabularyFormData {
    Word: string;
    Meaning: string;
    Sentences: string;
    _generateImage: boolean;
}

const props = defineProps<{
    modelValue: VocabularyFormData;
    isGeneratingAny?: boolean;
    maxSentencesCount: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: VocabularyFormData): void;
    (e: 'update:maxSentencesCount', value: number): void;
    (e: 'update:imageFile', value: File | null): void;
    (e: 'error', message: string): void;
}>();

const data = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const canGenerate = computed(() => !!data.value.Word && !props.isGeneratingAny);

const updateField = (field: keyof VocabularyFormData, value: any) => {
    data.value = { ...data.value, [field]: value };
};

const handleError = (msg: string) => emit('error', msg);

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
            <label class="block text-sm font-medium text-slate-300 mb-1">Palavra (Ex: 食[た]べ物[もの])</label>
            <input
                v-model="data.Word"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
        
        <AiTextField
            :model-value="data.Meaning"
            @update:model-value="v => updateField('Meaning', v)"
            label="Significado"
            prompt-type="VocabularyMeaning"
            :depends-on="data.Word"
            :can-generate="canGenerate"
            required
            @error="handleError"
        />

        <div>
            <AiTextareaField
                :model-value="data.Sentences"
                @update:model-value="v => updateField('Sentences', v)"
                label="Sentenças"
                prompt-type="VocabularySentences"
                :depends-on="data.Word"
                :can-generate="canGenerate"
                :max-count="maxSentencesCount"
                @update:max-count="v => emit('update:maxSentencesCount', v)"
                placeholder="Frase|Tradução||Frase2|Tradução2"
                @error="handleError"
            />
            <ListPreview :model-value="data.Sentences" title="Preview das Sentenças" />
        </div>

        <div class="border border-slate-700 rounded p-4 bg-slate-900/50">
            <label class="block text-sm font-medium text-slate-300 mb-3">Ilustração (Opcional)</label>
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
                <span class="text-slate-500">ou</span>
                <label class="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                    <input
                        type="checkbox"
                        v-model="data._generateImage"
                        class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>✨ Gerar com IA</span>
                </label>
            </div>
        </div>
    </div>
</template>
