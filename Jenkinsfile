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

        stage('Dockerize Client') {
            steps {
                dir('client') {
                    // O Dockerfile agora tem multi-stage build e rodará o npm install/build lá dentro!
                    sh "docker build -t ${CLIENT_IMAGE}:${TAG} -t ${CLIENT_IMAGE}:latest ."
                }
            }
        }

        stage('Dockerize Server') {
            steps {
                dir('server') {
                    // O Dockerfile do server já instala as dependências lá dentro
                    sh "docker build -t ${SERVER_IMAGE}:${TAG} -t ${SERVER_IMAGE}:latest ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "Iniciando Push usando o plugin nativo do Docker..."
                    try {
                        // Usa a função nativa do Jenkins que gerencia a autenticação com segurança
                        docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                            
                            // Client
                            def clientImg = docker.image("${CLIENT_IMAGE}:${TAG}")
                            clientImg.push()
                            clientImg.push('latest')
                            
                            // Server
                            def serverImg = docker.image("${SERVER_IMAGE}:${TAG}")
                            serverImg.push()
                            serverImg.push('latest')
                            
                        }
                    } catch (Exception e) {
                        echo "===== OCORREU UM ERRO DURANTE O PUSH ====="
                        echo e.toString()
                        throw e
                    }
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
