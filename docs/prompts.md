# Prompts para Geração de Conteúdo

Esta página armazena prompts recomendados para usar com IAs (como ChatGPT, Claude) na hora de gerar o preenchimento automático das notas do Anki.

## JP::Grammar (Nota de Gramática)

Use o prompt abaixo quando quiser extrair todas as informações de um ponto gramatical específico ou de uma frase de exemplo que você encontrou.

**Prompt Sugerido:**

```text
Atue como um professor nativo de japonês. Eu vou te fornecer um ponto gramatical ou uma frase específica e eu quero que você me devolva as informações estruturadas exatamente no formato abaixo, sem adicionar comentários ou explicações extras.

Tópico: O tópico gramatical (ex: [V] + かもしれません)
Frase: Uma frase clara e natural aplicando a gramática (use furiganas no formato Kanji[furigana] e coloque a parte da gramática entre asteriscos duplos ** **). Ex: 明日[あした]雨[あめ]が降[ふ]る**かもしれません**。
Estrutura: Uma explicação concisa da gramática, suas nuances, e como se forma. Você pode usar formatação em Markdown (negrito, itálico, listas, etc).
Análise: Separe a frase em pequenos blocos (palavras/partículas), no formato:
Bloco1|Tradução1||Bloco2|Tradução2||Bloco3|Tradução3
Observações: Crie uma lista com 2 a 3 observações cruciais sobre o uso (ex: restrições, nível de formalidade). Formato:
Obs1||Obs2||Obs3
Exemplos: Crie 5 frases extras usando o mesmo tópico, separadas por ||. Formato:
Frase1 com Kanji[furigana]|Tradução1||Frase2 com Kanji[furigana]|Tradução2
Dica: Uma dica rápida ou macete para memorizar (pode usar Markdown).

Por favor, faça isso para a seguinte gramática/frase:
[INSIRA SUA GRAMÁTICA AQUI]
```

## JP::Kanji (Nota de Kanji)

Use o prompt abaixo quando quiser extrair todas as informações de um kanji específico.

**Prompt Sugerido:**

```text
Atue como um professor nativo de japonês. Eu vou te fornecer um Kanji e eu quero que você me devolva as informações estruturadas exatamente no formato abaixo, sem adicionar comentários ou explicações extras.

Kanji: O kanji (ex: 水)
Significado: O significado principal em português (ex: Água)
Onyomi: As leituras Onyomi em Katakana, separadas por vírgula (ex: スイ)
Kunyomi: As leituras Kunyomi em Hiragana, separadas por vírgula (ex: みず)
Palavras: Crie 5 palavras comuns usando este Kanji, separadas por ||. Formato:
Palavra1 com Kanji[furigana]|Significado1||Palavra2 com Kanji[furigana]|Significado2
Sentenças: Crie 3 frases de exemplo usando as palavras acima, separadas por ||. Formato:
Frase1 com Kanji[furigana]|Tradução1||Frase2 com Kanji[furigana]|Tradução2

Por favor, faça isso para o seguinte Kanji:
[INSIRA SEU KANJI AQUI]
```

## JP::Vocabulary (Nota de Vocabulário)

Use o prompt abaixo quando quiser extrair todas as informações de uma palavra específica.

**Prompt Sugerido:**

```text
Atue como um professor nativo de japonês. Eu vou te fornecer uma palavra e eu quero que você me devolva as informações estruturadas exatamente no formato abaixo, sem adicionar comentários ou explicações extras.

Palavra: A palavra com furigana (ex: 先生[せんせい])
Significado: O significado principal em português (ex: Professor)
Sentenças: Crie 5 frases de exemplo naturais usando esta palavra, separadas por ||. Formato:
Frase1 com Kanji[furigana]|Tradução1||Frase2 com Kanji[furigana]|Tradução2

Por favor, faça isso para a seguinte palavra:
[INSIRA SUA PALAVRA AQUI]
```

## Ilustrações (Midjourney / DALL-E / Stable Diffusion)

Quando precisar gerar uma ilustração para o flashcard (seja para vocabulário ou gramática) em ferramentas de geração de imagem.

**Prompt Sugerido:**

```text
Crie um prompt em inglês para o Midjourney/DALL-E gerar uma ilustração focada na palavra/conceito: "[INSIRA A PALAVRA OU CONCEITO AQUI]".

A imagem deve ter estilo anime moderno de alta qualidade (Studio Ghibli / Makoto Shinkai), mostrando a ação ou objeto de forma muito clara. Não inclua textos na imagem.
```
