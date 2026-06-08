<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Image as ImageIcon } from 'lucide-vue-next';
import AiTextField from '../fields/AiTextField.vue';
import AiTextareaField from '../fields/AiTextareaField.vue';
import ListPreview from '../fields/ListPreview.vue';

interface GrammarFormData {
    Topic: string;
    Sentence: string;
    Structure: string;
    Analysis: string;
    Observations: string;
    Examples: string;
    Hint: string;
    _generateImage: boolean;
}

const props = defineProps<{
    modelValue: GrammarFormData;
    isGeneratingAny?: boolean;
    maxSentencesCount: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: GrammarFormData): void;
    (e: 'update:maxSentencesCount', value: number): void;
    (e: 'update:imageFile', value: File | null): void;
    (e: 'error', message: string): void;
}>();

const data = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const canGenerate = computed(() => !!data.value.Sentence && !props.isGeneratingAny);

const updateField = (field: keyof GrammarFormData, value: any) => {
    data.value = { ...data.value, [field]: value };
};

const smartImportText = ref('');

const applySmartImport = () => {
    const text = smartImportText.value;
    if (!text) return;

    const extract = (key: string, nextKeys: string[]) => {
        // Monta o lookahead para parar na próxima chave encontrada ou no final do texto
        const nextKeysPattern = nextKeys.length ? nextKeys.map(k => `(?:\\*?\\*?${k}\\*?\\*?\\s*:)`).join('|') : '';
        const lookahead = nextKeysPattern ? `(?=${nextKeysPattern}|$)` : '(?=$)';
        
        // Aceita a chave com ou sem asteriscos de markdown
        const regex = new RegExp(`\\*?\\*?${key}\\*?\\*?\\s*:([\\s\\S]*?)${lookahead}`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    };

    const keys = ['Tópico', 'Frase', 'Estrutura', 'Análise', 'Observações', 'Exemplos', 'Dica'];

    const topic = extract('Tópico', keys.slice(1));
    const sentence = extract('Frase', keys.slice(2));
    const structure = extract('Estrutura', keys.slice(3));
    const analysis = extract('Análise', keys.slice(4));
    const observations = extract('Observações', keys.slice(5));
    const examples = extract('Exemplos', keys.slice(6));
    const hint = extract('Dica', []);

    const updates: any = {};
    if (topic) updates.Topic = topic;
    if (sentence) updates.Sentence = sentence;
    if (structure) updates.Structure = structure;
    if (analysis) updates.Analysis = analysis;
    if (observations) updates.Observations = observations;
    if (examples) updates.Examples = examples;
    if (hint) updates.Hint = hint;

    if (Object.keys(updates).length > 0) {
        data.value = { ...data.value, ...updates };
    }

    smartImportText.value = '';
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
        <div class="border border-indigo-500/50 rounded p-4 bg-indigo-900/20 mb-6">
            <label class="block text-sm font-medium text-indigo-300 mb-2">✨ Importação Rápida (Cole o texto gerado pela IA)</label>
            <div class="flex gap-2">
                <textarea
                    v-model="smartImportText"
                    class="w-full bg-slate-900 border border-indigo-700/50 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors h-10 resize-y min-h-[40px]"
                    placeholder="Cole aqui o resultado do ChatGPT/Claude..."
                ></textarea>
                <button 
                    type="button" 
                    @click="applySmartImport"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors whitespace-nowrap font-medium text-sm"
                >
                    Preencher
                </button>
            </div>
        </div>

        <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Tópico (Opcional, Ex: [V] + かもしれません)</label>
            <input
                v-model="data.Topic"
                type="text"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>

        <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Frase Principal (Use ** para destacar)</label>
            <input
                v-model="data.Sentence"
                type="text"
                required
                placeholder="明日[あした]雨[あめ]が降[ふ]る**がもしれません**。"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>

        <AiTextareaField
            :model-value="data.Structure"
            @update:model-value="v => updateField('Structure', v)"
            label="Estrutura (Markdown)"
            prompt-type="GrammarStructure"
            :depends-on="data.Sentence"
            :can-generate="canGenerate"
            @error="handleError"
            placeholder="Explicação da estrutura. Aceita Markdown."
        />

        <div>
            <AiTextareaField
                :model-value="data.Analysis"
                @update:model-value="v => updateField('Analysis', v)"
                label="Análise da Frase"
                prompt-type="GrammarAnalysis"
                :depends-on="data.Sentence"
                :can-generate="canGenerate"
                @error="handleError"
                placeholder="明日[あした]|amanhã||雨[あめ]が降[ふ]る|chover"
            />
            <ListPreview :model-value="data.Analysis" title="Preview da Análise" />
        </div>

        <div>
            <AiTextareaField
                :model-value="data.Observations"
                @update:model-value="v => updateField('Observations', v)"
                label="Observações"
                prompt-type="GrammarObservations"
                :depends-on="data.Sentence"
                :can-generate="canGenerate"
                @error="handleError"
                placeholder="Obs 1||Obs 2"
            />
            <ListPreview :model-value="data.Observations" title="Preview das Observações" />
        </div>

        <div>
            <AiTextareaField
                :model-value="data.Examples"
                @update:model-value="v => updateField('Examples', v)"
                label="Exemplos"
                prompt-type="GrammarExamples"
                :depends-on="data.Sentence"
                :can-generate="canGenerate"
                :max-count="maxSentencesCount"
                @update:max-count="v => emit('update:maxSentencesCount', v)"
                placeholder="Frase|Tradução||Frase2|Tradução2"
                @error="handleError"
            />
            <ListPreview :model-value="data.Examples" title="Preview dos Exemplos" />
        </div>

        <AiTextareaField
            :model-value="data.Hint"
            @update:model-value="v => updateField('Hint', v)"
            label="Dica (Markdown)"
            prompt-type="GrammarHint"
            :depends-on="data.Sentence"
            :can-generate="canGenerate"
            @error="handleError"
            placeholder="Dica opcional em Markdown."
        />

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
