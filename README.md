# AnkiConnect Katakana (Anki Card Creator)

Este projeto é uma ferramenta completa para automação e criação de flashcards no Anki. Ele é composto por um servidor (Node.js com Express e TypeScript) e uma interface web (Vue 3 com Tailwind CSS e Vite). 

O sistema utiliza a API do AnkiConnect para se comunicar com o Anki localmente e integra-se a serviços externos (como Google Gemini, Pexels, Google TTS e Kuroshiro) para gerar cards enriquecidos com áudio, imagens, leitura (furigana/romaji) e definições.

## 🚀 Funcionalidades

- **Integração com Anki:** Comunicação direta com o seu Anki local via AnkiConnect.
- **Importação em Massa (CLI ou Web):** Lê listas de palavras a partir de arquivos CSV e cria os flashcards de forma automatizada, controlando o progresso e registrando as palavras importadas, ignoradas (já existentes) ou que falharam.
- **Importação Manual:** Interface web que permite criar cards individualmente, revisando o conteúdo gerado antes de enviar ao Anki.
- **Enriquecimento de Cards:**
  - **Geração de Áudio:** Utiliza o Google TTS para gerar a pronúncia da palavra.
  - **Processamento de Imagens:** Suporte a busca de imagens (Pexels API) ou upload manual, processando-as com `fluent-ffmpeg`.
  - **Transliteração (Kuroshiro):** Converte Kanji para Hiragana/Romaji para auxiliar na leitura.
  - **Inteligência Artificial:** Utiliza o Google Gemini para gerar frases de exemplo, definições ou traduções estruturadas.
- **Gerenciamento de Cards (Notes Browser):** Interface para visualizar os cards que já foram criados ou importados.

## 🧰 Tecnologias e Bibliotecas

### Servidor (Backend)
- **[Node.js](https://nodejs.org/):** Ambiente de execução.
- **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática para maior segurança e previsibilidade do código.
- **[Express](https://expressjs.com/):** Framework web para a criação da API REST.
- **[@google/genai](https://www.npmjs.com/package/@google/genai):** Integração com a API do Google Gemini para geração inteligente de dados dos flashcards.
- **[Google TTS API](https://www.npmjs.com/package/google-tts-api):** Geração de áudios com a pronúncia das palavras.
- **[Kuroshiro](https://kuroshiro.org/) / [Kuromoji](https://www.npmjs.com/package/kuroshiro-analyzer-kuromoji):** Utilizados para analisar textos em japonês e converter Kanji para Furigana/Romaji.
- **[Fluent-FFmpeg](https://www.npmjs.com/package/fluent-ffmpeg):** Interface em Node.js para o FFmpeg, usada no processamento e compressão das mídias.
- **[Multer](https://www.npmjs.com/package/multer):** Middleware para lidar com uploads de arquivos (ex: imagens e áudios manuais).
- **[CLI-Progress](https://www.npmjs.com/package/cli-progress):** Exibe a barra de progresso customizada durante a importação em massa via CLI.
- **[Axios](https://axios-http.com/):** Cliente HTTP para requisições externas e comunicação com o AnkiConnect.

### Cliente (Frontend)
- **[Vue 3](https://vuejs.org/):** Framework JavaScript progressivo para a construção da interface de usuário, utilizando a Composition API (`<script setup>`).
- **[Vite](https://vitejs.dev/):** Ferramenta de build super rápida para o frontend.
- **[TypeScript](https://www.typescriptlang.org/):** Utilizado para tipar os componentes e integrações.
- **[Tailwind CSS (v4)](https://tailwindcss.com/):** Framework CSS utilitário para estilização rápida e responsiva.
- **[Vue Router](https://router.vuejs.org/):** Gerenciamento de rotas e navegação entre o Dashboard, Importação e Navegador de Cards.
- **[Axios](https://axios-http.com/):** Realiza as chamadas para a API local (Servidor).
- **[Lucide Vue Next](https://lucide.dev/):** Biblioteca de ícones moderna e limpa.

## 🎴 Templates do Anki

O projeto contém um script dedicado (\`server/src/scripts/generate_templates.ts\`) que gera e atualiza automaticamente os modelos de notas (Note Types) no seu Anki via AnkiConnect. Esses templates possuem um design moderno, com CSS global, suporte a dark mode, animações (ordem dos traços em SVG para Kanji), controles de áudio avançados (velocidade/autoplay), e botões interativos (copiar, dicionário externo, integração com IA e favoritos).

Os modelos criados e seus respectivos tipos de cartões são:

### 1. JP::Kanji
Focado no estudo de Kanji. Ele gera os seguintes cartões:
- **1. Kanji -> Significado:** Exibe o Kanji em destaque na frente. O verso revela o significado, leituras (Onyomi e Kunyomi), a animação da escrita em SVG, além de uma lista de vocabulários e sentenças de exemplo que utilizam o Kanji.
- **2. Significado -> Kanji:** Exibe o significado na frente, exigindo que você lembre como escrever ou ler o caractere antes de virar a carta.

### 2. JP::Vocabulary
Focado no estudo de palavras em contexto. Ele gera os seguintes cartões:
- **1. Word -> Meaning:** Exibe a palavra japonesa na frente (com funcionalidade de clique para revelar/esconder o Furigana). O verso exibe o significado, a ilustração da palavra, áudio e exemplos de sentenças.
- **2. Meaning -> Word:** Traz o significado na frente (juntamente com um botão de áudio opcional), para você tentar lembrar a palavra em japonês.
- **3. Audio -> Word:** Um cartão focado em *listening*. Toca o áudio na frente e pede que você se lembre da palavra e do seu significado.

## 📋 Pré-requisitos

Para rodar este projeto, você precisará ter instalado em sua máquina:

1. **[Node.js](https://nodejs.org/):** Versão 18+ ou 20+ recomendada.
2. **[Anki](https://apps.ankiweb.net/):** O aplicativo desktop do Anki rodando.
3. **[AnkiConnect](https://ankiweb.net/shared/info/2055492159):** Um add-on para o Anki. Instale-o no Anki e certifique-se de que ele esteja habilitado e rodando na porta padrão (`8765`).
4. **[FFmpeg](https://ffmpeg.org/):** Necessário para manipulação de áudio/imagem no backend.

## ⚙️ Configuração do Ambiente

1. Clone o repositório ou acesse a pasta do projeto.
2. Configure as variáveis de ambiente do **Servidor**:

Na pasta `server`, crie uma cópia do arquivo `.env.example` com o nome `.env`:

```bash
cd server
cp .env.example .env
```

Edite o arquivo `.env` com as suas chaves e configurações do Anki:

```env
ANKI_URL=http://localhost:8765
ANKI_DECK=Japanese::Vocabulario::Katakana
ANKI_MODEL=JP::Katakana
PEXELS_API_KEY=sua_chave_do_pexels_aqui
GEMINI_API_KEY=sua_chave_do_gemini_aqui
YAHOO_CLIENT_ID=sua_chave_do_yahoo_aqui
```

3. Instale as dependências:

Para o Servidor:
```bash
cd server
npm install
```

Para o Cliente (Interface Web):
```bash
cd ../client
npm install
```

## 🛠️ Como Executar o Projeto

O projeto pode ser operado de duas formas principais: via Linha de Comando (CLI) para scripts de automação ou via Interface Web.

### 1. Interface Web (Cliente + Servidor API)

Para usar a interface gráfica (Manual Import, Bulk Import, etc.), você precisa rodar tanto o servidor da API quanto o cliente.

**Terminal 1 (Servidor API):**
```bash
cd server
npm run dev
```
O servidor rodará por padrão na porta `3000` (`http://localhost:3000`).

**Terminal 2 (Cliente Web):**
```bash
cd client
npm run dev
```
O Vite iniciará o frontend. Acesse a URL indicada no terminal (geralmente `http://localhost:5173`).

### 2. Modo CLI (Apenas Servidor)

Se você deseja apenas rodar um arquivo CSV contendo palavras e enviar tudo automaticamente para o Anki, pode utilizar o script CLI do servidor. 
Ele lê o arquivo especificado (por padrão em `words/w1.csv`) e processa tudo com uma barra de progresso no terminal.

**Terminal:**
```bash
cd server
npm run start
```
Após o processamento, os resultados serão salvos nas raiz como `imported.csv`, `skipped.csv` e `failed.csv`.

## 📁 Estrutura do Projeto

- `/client`: Frontend em Vue 3, contendo o Dashboard e telas de importação (`ManualImport.vue`, `BulkImport.vue`, `NotesBrowser.vue`).
- `/server`: Backend em Node.js/TypeScript.
  - `/src/api.ts`: Ponto de entrada da API REST.
  - `/src/cli.ts`: Ponto de entrada do script de automação via linha de comando.
  - `/src/controllers`: Controladores das rotas de Anki, Importação, Geração via IA e Mídia.
  - `/src/services`: Regras de negócio (ex: AnkiService, CardCreationService).
- `/words`: Diretório onde se localizam os arquivos CSV (ex: `w1.csv`) para importação em massa via CLI.
- `/audio`: Diretório para arquivos de áudio processados.
