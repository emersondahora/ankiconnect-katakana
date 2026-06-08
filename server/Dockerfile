# ESTÁGIO 1: Build da Aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./

# Instala TODAS as dependências (incluindo devDependencies como typescript)
RUN npm ci || npm install

# Copia todo o código fonte
COPY . .

# Executa o build (compila o TypeScript para a pasta dist)
RUN npm run build

# ESTÁGIO 2: Imagem de Produção (leve e segura)
FROM node:20-alpine

WORKDIR /app

# Copia as definições do npm para instalar APENAS as dependências de produção
COPY package*.json ./
RUN npm ci --only=production || npm install --omit=dev

# Copia apenas o código compilado do estágio anterior
COPY --from=builder /app/dist ./dist

# A porta padrão que o seu server Node expõe
EXPOSE 3000

# Executa o servidor node rodando o código já compilado para JavaScript puro!
CMD ["node", "dist/api.js"]
