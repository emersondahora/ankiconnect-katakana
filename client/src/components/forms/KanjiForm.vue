<script setup lang="ts">
import { computed } from 'vue';
import AiTextField from '../fields/AiTextField.vue';
import AiTextareaField from '../fields/AiTextareaField.vue';
import ListPreview from '../fields/ListPreview.vue';

interface KanjiFormData {
    Kanji: string;
    Meaning: string;
    Onyomi: string;
    Kunyomi: string;
    Words: string;
    Sentences: string;
}

const props = defineProps<{
    modelValue: KanjiFormData;
    isGeneratingAny?: boolean;
    maxWordsCount: number;
    maxSentencesCount: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: KanjiFormData): void;
    (e: 'update:maxWordsCount', value: number): void;
    (e: 'update:maxSentencesCount', value: number): void;
    (e: 'error', message: string): void;
}>();

const data = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const canGenerate = computed(() => !!data.value.Kanji && !props.isGeneratingAny);

const updateField = (field: keyof KanjiFormData, value: string) => {
    data.value = { ...data.value, [field]: value };
};

const handleError = (msg: string) => emit('error', msg);

</script>

<template>
    <div class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Kanji</label>
            <input
                v-model="data.Kanji"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
        
        <AiTextField
            :model-value="data.Meaning"
            @update:model-value="v => updateField('Meaning', v)"
            label="Significado"
            prompt-type="Meaning"
            :depends-on="data.Kanji"
            :can-generate="canGenerate"
            required
            @error="handleError"
        />

        <div class="grid grid-cols-2 gap-4">
            <AiTextField
                :model-value="data.Onyomi"
                @update:model-value="v => updateField('Onyomi', v)"
                label="Onyomi"
                prompt-type="Onyomi"
                :depends-on="data.Kanji"
                :can-generate="canGenerate"
                @error="handleError"
            />
            
            <AiTextField
                :model-value="data.Kunyomi"
                @update:model-value="v => updateField('Kunyomi', v)"
                label="Kunyomi"
                prompt-type="Kunyomi"
                :depends-on="data.Kanji"
                :can-generate="canGenerate"
                @error="handleError"
            />
        </div>

        <div>
            <AiTextareaField
                :model-value="data.Words"
                @update:model-value="v => updateField('Words', v)"
                label="Palavras"
                prompt-type="Words"
                :depends-on="data.Kanji"
                :can-generate="canGenerate"
                :max-count="maxWordsCount"
                @update:max-count="v => emit('update:maxWordsCount', v)"
                placeholder="Palavra|Significado||Palavra2|Significado2"
                @error="handleError"
            />
            <ListPreview :model-value="data.Words" title="Preview das Palavras" />
        </div>

        <div>
            <AiTextareaField
                :model-value="data.Sentences"
                @update:model-value="v => updateField('Sentences', v)"
                label="Sentenças"
                prompt-type="Sentences"
                :depends-on="data.Words"
                :can-generate="canGenerate"
                :max-count="maxSentencesCount"
                @update:max-count="v => emit('update:maxSentencesCount', v)"
                placeholder="Frase|Tradução||Frase2|Tradução2"
                @error="handleError"
            />
            <ListPreview :model-value="data.Sentences" title="Preview das Sentenças" />
        </div>
    </div>
</template>
