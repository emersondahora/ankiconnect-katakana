<script setup lang="ts">
import { ref, computed } from "vue";
import { ImportAPI } from "../api/import";
import DeckSelector from "../components/DeckSelector.vue";
import { useCache } from "../composables/useCache";
import { openPreviewModal } from "../composables/usePreviewMode";
import {
  Save,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
} from "lucide-vue-next";

const selectedDeck = useCache("selected-deck", "");
const selectedModel = useCache("selected-model", "JP::Vocabulary");

// Quantidade máxima para listas
const maxWordsCount = useCache("max-words-count", 5);
const maxSentencesCount = useCache("max-sentences-count", 5);

const isSubmitting = ref(false);
const statusMessage = ref<{ type: "success" | "error"; text: string } | null>(
  null,
);

// Campos dinâmicos
const formData = ref<Record<string, any>>({
  Kanji: "",
  Meaning: "",
  Onyomi: "",
  Kunyomi: "",
  Words: "",
  Sentences: "",
  Word: "",
  _generateImage: false,
  word: "",
  meaning: "",
  image_terms: "",
  sentences: "",
});
const imageFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const generatingFields = ref<Record<string, boolean>>({});

const primaryItem = computed(() => {
  if (selectedModel.value === "JP::Kanji") return formData.value.Kanji;
  if (selectedModel.value === "JP::Vocabulary") return formData.value.Word;
  return formData.value.word; // Katakana
});

const isGeneratingAny = computed(() =>
  Object.values(generatingFields.value).some((v) => v),
);
const canGenerate = computed(
  () => !!primaryItem.value && !isGeneratingAny.value,
);
const isFormDisabled = computed(
  () => isSubmitting.value || isGeneratingAny.value,
);

const generateField = async (fieldKey: string, type: string) => {
  if (!canGenerate.value) return;
  generatingFields.value[fieldKey] = true;
  statusMessage.value = null;

  try {
    // Para frases do Kanji, passa as palavras como contexto (se existirem)
    const context =
      type === "Sentences" && selectedModel.value === "JP::Kanji"
        ? formData.value.Words
        : "";
    const maxCount =
      type === "Sentences"
        ? maxSentencesCount.value
        : type === "Words"
          ? maxWordsCount.value
          : 5;

    const res = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        item: primaryItem.value,
        context,
        maxCount,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao gerar campo");

    formData.value[fieldKey] = data.result;
  } catch (err: any) {
    statusMessage.value = { type: "error", text: err.message };
  } finally {
    generatingFields.value[fieldKey] = false;
  }
};

const generateAllEmpty = async () => {
  if (!canGenerate.value) return;

  if (selectedModel.value === "JP::Kanji") {
    if (!formData.value.Meaning) await generateField("Meaning", "Meaning");
    if (!formData.value.Onyomi) await generateField("Onyomi", "Onyomi");
    if (!formData.value.Kunyomi) await generateField("Kunyomi", "Kunyomi");
    if (!formData.value.Words) await generateField("Words", "Words");
    if (!formData.value.Sentences)
      await generateField("Sentences", "Sentences");
  } else if (selectedModel.value === "JP::Vocabulary") {
    if (!formData.value.Meaning) await generateField("Meaning", "Meaning");
    if (!formData.value.Sentences)
      await generateField("Sentences", "Sentences");
  } else if (selectedModel.value === "JP::Katakana") {
    if (!formData.value.meaning) await generateField("meaning", "Meaning");
    if (!formData.value.sentences)
      await generateField("sentences", "Sentences");
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    imageFile.value = target.files[0];
  }
};

const clearForm = () => {
  const lastGen = formData.value._generateImage;
  formData.value = {
    Kanji: "",
    Meaning: "",
    Onyomi: "",
    Kunyomi: "",
    Words: "",
    Sentences: "",
    Word: "",
    _generateImage: lastGen,
    word: "",
    meaning: "",
    image_terms: "",
    sentences: "",
  };
  imageFile.value = null;
  if (fileInput.value) fileInput.value.value = "";
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
    ["Kanji", "Meaning", "Onyomi", "Kunyomi", "Words", "Sentences"].forEach(
      (k) => payload.append(k, formData.value[k]),
    );
  } else if (selectedModel.value === "JP::Vocabulary") {
    ["Word", "Meaning", "Sentences"].forEach((k) =>
      payload.append(k, formData.value[k]),
    );
    payload.append(
      "_generateImage",
      formData.value._generateImage ? "true" : "false",
    );
    if (imageFile.value) {
      payload.append("file", imageFile.value);
    }
  } else {
    ["word", "meaning", "sentences", "image_terms"].forEach((k) =>
      payload.append(k, formData.value[k] || ""),
    );
    if (imageFile.value) {
      payload.append("file", imageFile.value);
    }
  }

  try {
    const res = await fetch("http://localhost:3000/api/upload/manual", {
      method: "POST",
      body: payload,
    });
    const data = await res.json();

    if (res.status === 409) {
      isSubmitting.value = false;
      if (
        confirm(
          "Essa nota já existe. Deseja atualizar os dados existentes com os novos valores?",
        )
      ) {
        await submitManual(true);
      }
      return;
    }

    if (!res.ok) throw new Error(data.error || "Erro ao importar");

    statusMessage.value = {
      type: "success",
      text: `Nota importada com sucesso no deck '${selectedDeck.value}' (modelo ${selectedModel.value})!`,
    };
    if (data.fields) {
      openPreviewModal(data.fields, selectedModel.value, true);
    }
    // clearForm()
  } catch (err: any) {
    statusMessage.value = { type: "error", text: err.message };
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="h-full p-6 overflow-y-auto">
    <div class="max-w-2xl mx-auto space-y-6">
      <div
        class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700"
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Importação Individual</h2>
          <button
            v-if="selectedModel"
            type="button"
            @click="generateAllEmpty"
            :disabled="!canGenerate"
            class="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles class="w-4 h-4" />
            <span>Gerar Todos (Vazios)</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >Target Deck</label
            >
            <DeckSelector v-model="selectedDeck" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >Anki Model</label
            >
            <select
              v-model="selectedModel"
              class="w-full bg-slate-700 text-white rounded p-2 border border-slate-600 focus:outline-none focus:border-indigo-500"
            >
              <option value="JP::Katakana">JP::Katakana</option>
              <option value="JP::Kanji">JP::Kanji</option>
              <option value="JP::Vocabulary">JP::Vocabulary</option>
            </select>
          </div>
        </div>

        <form @submit.prevent="() => submitManual(false)" class="space-y-4">
          <!-- Campos Kanji -->
          <template v-if="selectedModel === 'JP::Kanji'">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1"
                >Kanji</label
              >
              <input
                v-model="formData.Kanji"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-slate-300"
                  >Significado</label
                >
                <button
                  type="button"
                  @click="generateField('Meaning', 'Meaning')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  title="Gerar Significado"
                >
                  <Loader2
                    v-if="generatingFields['Meaning']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <input
                v-model="formData.Meaning"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-sm font-medium text-slate-300"
                    >Onyomi</label
                  >
                  <button
                    type="button"
                    @click="generateField('Onyomi', 'Onyomi')"
                    :disabled="!canGenerate"
                    class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  >
                    <Loader2
                      v-if="generatingFields['Onyomi']"
                      class="w-4 h-4 animate-spin"
                    />
                    <Sparkles v-else class="w-4 h-4" />
                  </button>
                </div>
                <input
                  v-model="formData.Onyomi"
                  type="text"
                  class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-sm font-medium text-slate-300"
                    >Kunyomi</label
                  >
                  <button
                    type="button"
                    @click="generateField('Kunyomi', 'Kunyomi')"
                    :disabled="!canGenerate"
                    class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  >
                    <Loader2
                      v-if="generatingFields['Kunyomi']"
                      class="w-4 h-4 animate-spin"
                    />
                    <Sparkles v-else class="w-4 h-4" />
                  </button>
                </div>
                <input
                  v-model="formData.Kunyomi"
                  type="text"
                  class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label
                  class="block text-sm font-medium text-slate-300 flex items-center space-x-2"
                >
                  <span>Palavras</span>
                  <input
                    type="number"
                    v-model.number="maxWordsCount"
                    min="1"
                    max="20"
                    class="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center text-white"
                    title="Quantidade máxima"
                  />
                </label>
                <button
                  type="button"
                  @click="generateField('Words', 'Words')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Loader2
                    v-if="generatingFields['Words']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <textarea
                v-model="formData.Words"
                rows="3"
                placeholder="Palavra|Significado||Palavra2|Significado2"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              ></textarea>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label
                  class="block text-sm font-medium text-slate-300 flex items-center space-x-2"
                >
                  <span>Sentenças</span>
                  <input
                    type="number"
                    v-model.number="maxSentencesCount"
                    min="1"
                    max="10"
                    class="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center text-white"
                    title="Quantidade por palavra"
                  />
                </label>
                <button
                  type="button"
                  @click="generateField('Sentences', 'Sentences')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Loader2
                    v-if="generatingFields['Sentences']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <textarea
                v-model="formData.Sentences"
                rows="3"
                placeholder="Sentença|Significado||Sentença2|Significado2"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              ></textarea>
            </div>
          </template>

          <!-- Campos Vocabulary -->
          <template v-if="selectedModel === 'JP::Vocabulary'">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1"
                >Palavra (Ex: 食[た]べ物[もの])</label
              >
              <input
                v-model="formData.Word"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-slate-300"
                  >Significado</label
                >
                <button
                  type="button"
                  @click="generateField('Meaning', 'Meaning')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Loader2
                    v-if="generatingFields['Meaning']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <input
                v-model="formData.Meaning"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label
                  class="block text-sm font-medium text-slate-300 flex items-center space-x-2"
                >
                  <span>Sentenças</span>
                  <input
                    type="number"
                    v-model.number="maxSentencesCount"
                    min="1"
                    max="10"
                    class="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center text-white"
                    title="Quantidade"
                  />
                </label>
                <button
                  type="button"
                  @click="generateField('Sentences', 'Sentences')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Loader2
                    v-if="generatingFields['Sentences']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <textarea
                v-model="formData.Sentences"
                rows="3"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              ></textarea>
            </div>

            <div class="border border-slate-700 rounded p-4 bg-slate-900/50">
              <label class="block text-sm font-medium text-slate-300 mb-3"
                >Ilustração (Opcional)</label
              >
              <div class="flex items-center space-x-4">
                <label
                  class="flex items-center space-x-2 cursor-pointer bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded transition-colors text-sm text-white"
                >
                  <ImageIcon class="w-4 h-4" />
                  <span>Upload (JPG, PNG)</span>
                  <input
                    type="file"
                    ref="fileInput"
                    class="hidden"
                    accept="image/*"
                    @change="handleFileSelect"
                  />
                </label>
                <span
                  v-if="imageFile"
                  class="text-sm text-emerald-400 truncate max-w-[150px]"
                  >{{ imageFile.name }}</span
                >
                <span class="text-slate-500">ou</span>
                <label
                  class="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    v-model="formData._generateImage"
                    class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>✨ Gerar com IA</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Campos Katakana (Legado) -->
          <template v-if="selectedModel === 'JP::Katakana'">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1"
                >Palavra</label
              >
              <input
                v-model="formData.word"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-slate-300"
                  >Significado</label
                >
                <button
                  type="button"
                  @click="generateField('meaning', 'Meaning')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Loader2
                    v-if="generatingFields['meaning']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <input
                v-model="formData.meaning"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1"
                >Termos de Busca de Imagem (Ex: term1|term2)</label
              >
              <input
                v-model="formData.image_terms"
                type="text"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label
                  class="block text-sm font-medium text-slate-300 flex items-center space-x-2"
                >
                  <span>Sentenças</span>
                  <input
                    type="number"
                    v-model.number="maxSentencesCount"
                    min="1"
                    max="10"
                    class="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center text-white"
                    title="Quantidade"
                  />
                </label>
                <button
                  type="button"
                  @click="generateField('sentences', 'Sentences')"
                  :disabled="!canGenerate"
                  class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Loader2
                    v-if="generatingFields['sentences']"
                    class="w-4 h-4 animate-spin"
                  />
                  <Sparkles v-else class="w-4 h-4" />
                </button>
              </div>
              <textarea
                v-model="formData.sentences"
                rows="3"
                class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              ></textarea>
            </div>
          </template>

          <div class="pt-4 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span
                v-if="statusMessage && statusMessage.type === 'success'"
                class="text-emerald-400 flex items-center space-x-1 text-sm"
                ><CheckCircle class="w-4 h-4" />
                <span>{{ statusMessage.text }}</span></span
              >
              <span
                v-if="statusMessage && statusMessage.type === 'error'"
                class="text-red-400 flex items-center space-x-1 text-sm"
                ><XCircle class="w-4 h-4" />
                <span>{{ statusMessage.text }}</span></span
              >
            </div>
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
        </form>
      </div>
    </div>
  </div>
</template>
