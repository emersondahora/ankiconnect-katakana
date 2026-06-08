FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração do npm
COPY package*.json ./

# Instala SOMENTE as dependências de produção para reduzir a imagem
RUN npm ci --only=production || npm install --omit=dev

# Copia o restante do código da aplicação
# A pasta node_modules local não será copiada devido ao .dockerignore
COPY . .

# A porta padrão que o seu server Node geralmente expõe. Ajuste se necessário.
EXPOSE 3000

# Executa o servidor node (altere index.js se o seu ponto de entrada for outro, ex: server.js)
CMD ["node", "index.js"]
