pipeline {
    agent any

    environment {
        // ID da credencial cadastrada no Jenkins
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        
        // Substitua pelo seu nome de usuário do Docker Hub
        DOCKER_USERNAME = 'emersondahora'
        
        // Nomes das imagens
        CLIENT_IMAGE = "${DOCKER_USERNAME}/ankiconnect-katakana-client"
        SERVER_IMAGE = "${DOCKER_USERNAME}/ankiconnect-katakana-server"
        
        // Usaremos o número do build do Jenkins como tag, além da tag 'latest'
        TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                // Clona do Gitea (necessita de configuração do SCM no Job do Jenkins)
                checkout scm
            }
        }

        stage('Build Client') {
            steps {
                dir('client') {
                    // Instala dependências e compila o Vue3 para produção
                    // Assumindo que o output vai para a pasta 'dist'
                    sh 'npm ci || npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Server') {
            steps {
                dir('server') {
                    // Instala dependências do backend
                    sh 'npm ci || npm install'
                }
            }
        }

        stage('Dockerize Client') {
            steps {
                dir('client') {
                    // O Dockerfile copiará a pasta 'dist' recém-criada
                    sh "docker build -t ${CLIENT_IMAGE}:${TAG} -t ${CLIENT_IMAGE}:latest ."
                }
            }
        }

        stage('Dockerize Server') {
            steps {
                dir('server') {
                    // O Dockerfile empacotará o código do node
                    sh "docker build -t ${SERVER_IMAGE}:${TAG} -t ${SERVER_IMAGE}:latest ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                // Utiliza a credencial do Jenkins para fazer login no Docker Hub de forma segura
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    
                    // Client Push
                    sh "docker push ${CLIENT_IMAGE}:${TAG}"
                    sh "docker push ${CLIENT_IMAGE}:latest"
                    
                    // Server Push
                    sh "docker push ${SERVER_IMAGE}:${TAG}"
                    sh "docker push ${SERVER_IMAGE}:latest"
                    
                    // Logout por segurança
                    sh 'docker logout'
                }
            }
        }
    }
    
    post {
        always {
            // Limpeza das imagens locais para não lotar o disco do servidor do Jenkins
            sh "docker rmi ${CLIENT_IMAGE}:${TAG} ${CLIENT_IMAGE}:latest || true"
            sh "docker rmi ${SERVER_IMAGE}:${TAG} ${SERVER_IMAGE}:latest || true"
            
            // Limpa o workspace
            cleanWs()
        }
    }
}
