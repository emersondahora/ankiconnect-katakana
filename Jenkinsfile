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
            environment {
                // A sintaxe nativa do Pipeline Declarativo. 
                // O Jenkins automaticamente cria DOCKER_CREDS_USR e DOCKER_CREDS_PSW.
                DOCKER_CREDS = credentials('dockerhub-credentials')
            }
            steps {
                echo ">>> 1. INICIANDO O STAGE PUSH (Credenciais injetadas)"
                
                sh '''
                    echo ">>> 2. INICIANDO DOCKER LOGIN"
                    docker login -u "$DOCKER_CREDS_USR" -p "$DOCKER_CREDS_PSW"
                '''
                
                echo ">>> 3. INICIANDO PUSH DO CLIENT..."
                sh "docker push ${CLIENT_IMAGE}:${TAG}"
                sh "docker push ${CLIENT_IMAGE}:latest"
                
                echo ">>> 4. INICIANDO PUSH DO SERVER..."
                sh "docker push ${SERVER_IMAGE}:${TAG}"
                sh "docker push ${SERVER_IMAGE}:latest"
                
                sh 'docker logout'
                echo ">>> 5. FIM DO PUSH"
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
