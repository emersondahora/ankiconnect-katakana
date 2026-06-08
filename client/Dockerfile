# Usamos um servidor leve e de alta performance como o Nginx (Alpine Linux)
FROM nginx:alpine

# Remove os arquivos padrão do site HTML do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os artefatos estáticos (gerados no estágio 'Build Client' do Jenkins)
# O comando `npm run build` do Vue3 normalmente gera a pasta 'dist'
COPY dist/ /usr/share/nginx/html/

# Expõe a porta 80 que o Nginx usa internamente
EXPOSE 80

# Inicia o servidor em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
