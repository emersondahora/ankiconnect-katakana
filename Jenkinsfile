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
                    echo "Iniciando Push nativo usando Docker Pipeline Plugin..."
                    
                    // A função docker.withRegistry faz o login seguro
                    // e limpa a sessão depois, sem precisar usar o comando 'sh'
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        
                        echo "Fazendo push do Client..."
                        docker.image("${CLIENT_IMAGE}:${TAG}").push()
                        docker.image("${CLIENT_IMAGE}:latest").push()
                        
                        echo "Fazendo push do Server..."
                        docker.image("${SERVER_IMAGE}:${TAG}").push()
                        docker.image("${SERVER_IMAGE}:latest").push()
                        
                        echo "Imagens enviadas com sucesso!"
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
