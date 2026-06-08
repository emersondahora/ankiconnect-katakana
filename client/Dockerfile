# Estágio 1: Build do Vue.js
FROM node:20-alpine as builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm ci || npm install

# Copia o restante do código
COPY . .

# Faz o build de produção (gera a pasta dist/)
RUN npm run build

# Estágio 2: Servidor Nginx (Produção)
FROM nginx:alpine

# Remove os arquivos padrão do site HTML do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia a pasta 'dist' gerada no Estágio 1 para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html/

# Adiciona o script de injeção de variáveis de ambiente no tempo de execução
COPY generate-config.sh /docker-entrypoint.d/40-generate-config.sh
RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

# Expõe a porta 80 que o Nginx usa internamente
EXPOSE 80

# Inicia o servidor
CMD ["nginx", "-g", "daemon off;"]
