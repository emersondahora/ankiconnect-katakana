#!/bin/sh
# Este script e executado na inicializacao do Nginx (atraves do docker-entrypoint.d)
# Ele le a variavel de ambiente do Docker (VITE_API_URL) e cria o config.js

# Valor padrao (fallback para desenvolvimento local) se a variavel nao existir
DEFAULT_API_URL="http://localhost:3000/api"

# Pega o valor da variavel de ambiente ou usa o padrao
API_URL=${VITE_API_URL:-$DEFAULT_API_URL}
GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-""}

echo "Injetando VITE_API_URL = $API_URL no config.js"
echo "Injetando VITE_GOOGLE_CLIENT_ID = $GOOGLE_CLIENT_ID no config.js"

# Gera o arquivo config.js na pasta de HTML do Nginx
cat <<EOF > /usr/share/nginx/html/config.js
window.__ENV__ = {
  VITE_API_URL: "$API_URL",
  VITE_GOOGLE_CLIENT_ID: "$GOOGLE_CLIENT_ID"
};
EOF
