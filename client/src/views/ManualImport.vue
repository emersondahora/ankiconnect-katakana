<script setup lang="ts">
import { ref, computed } from "vue";
import { apiClient } from "../api/client";
import DeckSelector from "../components/DeckSelector.vue";
import { useCache } from "../composables/useCache";
import { openPreviewModal } from "../composables/usePreviewMode";
import {
  Save,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-vue-next";

// Forms
import KanjiForm from "../components/forms/KanjiForm.vue";
import VocabularyForm from "../components/forms/VocabularyForm.vue";
import KatakanaForm from "../components/forms/KatakanaForm.vue";
import GrammarForm from "../components/forms/GrammarForm.vue";

const selectedDeck = useCache("selected-deck", "");
const selectedModel = useCache("selected-model", "JP::Vocabulary");

const maxWordsCount = useCache("max-words-count", 5);
const maxSentencesCount = useCache("max-sentences-count", 5);

const isSubmitting = ref(false);
const isGeneratingBatch = ref(false);
const statusMessage = ref<{ type: "success" | "error"; text: string } | null>(null);

const formData = ref<Record<string, any>>({
  // Kanji
  Kanji: "", Meaning: "", Onyomi: "", Kunyomi: "", Words: "", Sentences: "",
  // Vocabulary
  Word: "", _generateImage: false,
  // Katakana
  word: "", meaning: "", image_terms: "", sentences: "",
  // Grammar
  Topic: "", Sentence: "", Structure: "", Analysis: "", Observations: "", Examples: "", Hint: "",
});

const imageFile = ref<File | null>(null);
const formRef = ref<any>(null); // For calling clearImage on child

const primaryItem = computed(() => {
  if (selectedModel.value === "JP::Kanji") return formData.value.Kanji;
  if (selectedModel.value === "JP::Vocabulary") return formData.value.Word;
  if (selectedModel.value === "JP::Grammar") return formData.value.Sentence;
  return formData.value.word;
});

const canGenerateBatch = computed(() => !!primaryItem.value && !isGeneratingBatch.value);
const isFormDisabled = computed(() => isSubmitting.value || isGeneratingBatch.value);

const generateAllEmpty = async () => {
  if (!canGenerateBatch.value) return;
  
  isGeneratingBatch.value = true;
  statusMessage.value = null;

  try {
    const filledFields: Record<string, string> = {};
    const targetFields: string[] = [];

    if (selectedModel.value === "JP::Kanji") {
      if (formData.value.Kanji) filledFields["Kanji"] = formData.value.Kanji;
      
      const keys = ["Meaning", "Onyomi", "Kunyomi", "Words", "Sentences"];
      for (const k of keys) {
        if (!formData.value[k]) targetFields.push(k);
        else filledFields[k] = formData.value[k];
      }
    } else if (selectedModel.value === "JP::Vocabulary") {
      if (formData.value.Word) filledFields["Word"] = formData.value.Word;
      
      const keys = ["Meaning", "Sentences"];
      for (const k of keys) {
        if (!formData.value[k]) targetFields.push(k);
        else filledFields[k] = formData.value[k];
      }
    } else if (selectedModel.value === "JP::Grammar") {
      if (formData.value.Sentence) filledFields["Sentence"] = formData.value.Sentence;
      if (formData.value.Topic) filledFields["Topic"] = formData.value.Topic;
      
      const keys = ["Structure", "Analysis", "Observations", "Examples", "Hint"];
      for (const k of keys) {
        if (!formData.value[k]) targetFields.push(k);
        else filledFields[k] = formData.value[k];
      }
    } else {
        // Legado não possui API nativa de IA Batch no momento, então simulamos que não há o que gerar.
        isGeneratingBatch.value = false;
        return;
    }

    if (targetFields.length === 0) {
      isGeneratingBatch.value = false;
      return;
    }

    const res = await apiClient.post("/generate/batch", {
      modelName: selectedModel.value,
      filledFields,
      targetFields,
      maxWords: maxWordsCount.value,
      maxSentences: maxSentencesCount.value
    });
    
    const data = res.data;

    // Preenche as propriedades retornadas
    if (data.result) {
      for (const [k, v] of Object.entries(data.result)) {
        formData.value[k] = v;
      }
    }

    statusMessage.value = { type: "success", text: "Campos gerados com sucesso!" };
    setTimeout(() => { statusMessage.value = null; }, 3000);

  } catch (err: any) {
    const msg = err.response?.data?.error || err.message || "Erro ao gerar em lote";
    statusMessage.value = { type: "error", text: msg };
  } finally {
    isGeneratingBatch.value = false;
  }
};

const clearForm = () => {
  const lastGen = formData.value._generateImage;
  formData.value = {
    Kanji: "", Meaning: "", Onyomi: "", Kunyomi: "", Words: "", Sentences: "",
    Word: "", _generateImage: lastGen,
    word: "", meaning: "", image_terms: "", sentences: "",
    Topic: "", Sentence: "", Structure: "", Analysis: "", Observations: "", Examples: "", Hint: "",
  };
  imageFile.value = null;
  if (formRef.value && formRef.value.clearImage) {
      formRef.value.clearImage();
  }
};

const submitManual = async (forceUpdate = false) => {
  if (!selectedDeck.value) {
    statusMessage.value = { type: "error", text: "Selecione um deck destino." };
    return;
  }
  if (isFormDisabled.value) return;

  isSubmitting.value = true;
  statusMessage.value = null;

  const payload = new FormData();
  payload.append("deck", selectedDeck.value);
  payload.append("modelName", selectedModel.value);
  payload.append("forceUpdate", forceUpdate ? "true" : "false");

  if (selectedModel.value === "JP::Kanji") {
    ["Kanji", "Meaning", "Onyomi", "Kunyomi", "Words", "Sentences"].forEach((k) => payload.append(k, formData.value[k] || ""));
  } else if (selectedModel.value === "JP::Vocabulary") {
    ["Word", "Meaning", "Sentences"].forEach((k) => payload.append(k, formData.value[k] || ""));
    payload.append("_generateImage", formData.value._generateImage ? "true" : "false");
    if (imageFile.value) payload.append("file", imageFile.value);
  } else if (selectedModel.value === "JP::Grammar") {
    ["Topic", "Sentence", "Structure", "Analysis", "Observations", "Examples", "Hint"].forEach((k) => payload.append(k, formData.value[k] || ""));
    payload.append("_generateImage", formData.value._generateImage ? "true" : "false");
    if (imageFile.value) payload.append("file", imageFile.value);
  } else {
    ["word", "meaning", "sentences", "image_terms"].forEach((k) => payload.append(k, formData.value[k] || ""));
    if (imageFile.value) payload.append("file", imageFile.value);
  }

  try {
    const res = await apiClient.post("/upload/manual", payload, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    const data = res.data;

    statusMessage.value = { type: "success", text: `Nota importada com sucesso no deck '${selectedDeck.value}'!` };
    if (data.fields) {
      openPreviewModal(data.fields, selectedModel.value, true);
    }
  } catch (err: any) {
    if (err.response?.status === 409) {
      isSubmitting.value = false;
      if (confirm("Essa nota já existe. Deseja atualizar os dados existentes com os novos valores?")) {
        await submitManual(true);
      }
      return;
    }
    const msg = err.response?.data?.error || err.message || "Erro ao importar";
    statusMessage.value = { type: "error", text: msg };
  } finally {
    isSubmitting.value = false;
  }
};

const handleError = (msg: string) => {
    statusMessage.value = { type: "error", text: msg };
};
</script>

<template>
  <div class="h-full p-6 overflow-y-auto">
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Importação Individual</h2>
          <button
            v-if="selectedModel !== 'JP::Katakana'"
            type="button"
            @click="generateAllEmpty"
            :disabled="!canGenerateBatch"
            class="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Loader2 v-if="isGeneratingBatch" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            <span>Gerar Todos (Vazios)</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Target Deck</label>
            <DeckSelector v-model="selectedDeck" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Anki Model</label>
            <select
              v-model="selectedModel"
              class="w-full bg-slate-700 text-white rounded p-2 border border-slate-600 focus:outline-none focus:border-indigo-500"
            >
              <option value="JP::Katakana">JP::Katakana</option>
              <option value="JP::Kanji">JP::Kanji</option>
              <option value="JP::Vocabulary">JP::Vocabulary</option>
              <option value="JP::Grammar">JP::Grammar</option>
            </select>
          </div>
        </div>

        <form @submit.prevent="() => submitManual(false)" class="space-y-4">
          
          <KanjiForm 
            v-if="selectedModel === 'JP::Kanji'" 
            :modelValue="(formData as any)"
            @update:modelValue="val => formData = val"
            v-model:maxWordsCount="maxWordsCount"
            v-model:maxSentencesCount="maxSentencesCount"
            :isGeneratingAny="isGeneratingBatch"
            @error="handleError"
          />

          <VocabularyForm 
            v-if="selectedModel === 'JP::Vocabulary'" 
            :modelValue="(formData as any)"
            @update:modelValue="val => formData = val"
            v-model:maxSentencesCount="maxSentencesCount"
            :isGeneratingAny="isGeneratingBatch"
            @update:imageFile="(f) => imageFile = f"
            ref="formRef"
            @error="handleError"
          />

          <KatakanaForm 
            v-if="selectedModel === 'JP::Katakana'" 
            :modelValue="(formData as any)"
            @update:modelValue="val => formData = val"
            v-model:maxSentencesCount="maxSentencesCount"
            @update:imageFile="(f) => imageFile = f"
            ref="formRef"
          />

          <GrammarForm 
            v-if="selectedModel === 'JP::Grammar'" 
            :modelValue="(formData as any)"
            @update:modelValue="val => formData = val"
            v-model:maxSentencesCount="maxSentencesCount"
            :isGeneratingAny="isGeneratingBatch"
            @update:imageFile="(f) => imageFile = f"
            ref="formRef"
            @error="handleError"
          />

          <div class="pt-4 flex items-end justify-end gap-5">
            <button
              type="button"
              @click="clearForm()"
              class="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Trash2 class="w-4 h-4" />
              <span>Limpar Form</span>
            </button>
            <button
              type="submit"
              :disabled="isFormDisabled"
              class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span
                v-if="isSubmitting"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
              ></span>
              <Save v-else class="w-4 h-4" />
              <span>Importar Nota</span>
            </button>
          </div>

          <div class="flex items-end justify-between">
            <div class="flex items-center space-x-2">
              <span
                v-if="statusMessage && statusMessage.type === 'success'"
                class="text-emerald-400 flex items-center space-x-1 text-sm"
              >
                <CheckCircle class="w-4 h-4" />
                <span>{{ statusMessage.text }}</span>
              </span>
              <span
                v-if="statusMessage && statusMessage.type === 'error'"
                class="text-red-400 flex items-center space-x-1 text-sm"
              >
                <XCircle class="w-4 h-4" />
                <span>{{ statusMessage.text }}</span>
              </span>
            </div>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>
