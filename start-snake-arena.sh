#!/bin/bash

# ============================================================================
# SCRIPT DE DÉMARRAGE - SNAKE ARENA 🐍
# ============================================================================
# Ce script démarre automatiquement tous les services requis pour Snake Arena
# sur Linux/macOS.
# ============================================================================

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions d'affichage
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_title() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

# Fonction pour vérifier si un port est utilisé
test_port() {
    local port=$1
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
        return $?
    elif command -v netstat &> /dev/null; then
        netstat -ln | grep ":$port " > /dev/null 2>&1
        return $?
    elif command -v ss &> /dev/null; then
        ss -ln | grep ":$port " > /dev/null 2>&1
        return $?
    else
        print_warning "Impossible de vérifier l'état des ports (nc, netstat, ss non disponibles)"
        return 1
    fi
}

# Fonction pour démarrer MongoDB
start_mongodb() {
    print_info "Vérification de MongoDB..."
    
    # Vérifier si MongoDB est déjà en cours d'exécution
    if test_port 27017; then
        print_success "MongoDB est déjà en cours d'exécution sur le port 27017"
        return 0
    fi
    
    print_info "Tentative de démarrage de MongoDB..."
    
    # Essayer différentes méthodes de démarrage selon l'OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v systemctl &> /dev/null; then
            sudo systemctl start mongod
        elif command -v service &> /dev/null; then
            sudo service mongod start
        elif command -v mongod &> /dev/null; then
            mongod --fork --logpath /var/log/mongodb/mongod.log &
        else
            print_warning "MongoDB n'est pas installé ou ne peut pas être démarré automatiquement"
            print_info "Veuillez démarrer MongoDB manuellement ou utiliser MongoDB Atlas"
            return 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew services start mongodb-community
        elif command -v mongod &> /dev/null; then
            mongod --fork --logpath /usr/local/var/log/mongodb/mongo.log &
        else
            print_warning "MongoDB n'est pas installé ou ne peut pas être démarré automatiquement"
            print_info "Veuillez démarrer MongoDB manuellement ou utiliser MongoDB Atlas"
            return 1
        fi
    fi
    
    # Attendre que MongoDB démarre
    sleep 3
    
    if test_port 27017; then
        print_success "MongoDB démarré avec succès"
        return 0
    else
        print_warning "MongoDB n'a pas pu être démarré automatiquement"
        print_info "Veuillez vérifier l'installation ou utiliser MongoDB Atlas"
        return 1
    fi
}

# Fonction pour démarrer le backend
start_backend() {
    local root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local backend_path="$root_path/backend"
    
    if ! [ -d "$backend_path" ]; then
        print_error "Dossier backend non trouvé: $backend_path"
        return 1
    fi
    
    # Vérifier si le backend est déjà en cours d'exécution
    if test_port 5000; then
        print_success "Le backend est déjà en cours d'exécution sur le port 5000"
        return 0
    fi
    
    print_info "Démarrage du backend..."
    
    # Vérifier si npm est installé
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé. Veuillez installer Node.js"
        return 1
    fi
    
    # Vérifier si les dépendances sont installées
    if ! [ -d "$backend_path/node_modules" ]; then
        print_info "Installation des dépendances du backend..."
        cd "$backend_path" && npm install
    fi
    
    # Démarrer le backend en arrière-plan
    cd "$backend_path"
    nohup npm start > /dev/null 2>&1 &
    local backend_pid=$!
    
    # Attendre que le backend démarre
    sleep 3
    
    if test_port 5000; then
        print_success "Backend démarré avec succès (PID: $backend_pid)"
        return 0
    else
        print_error "Échec du démarrage du backend"
        return 1
    fi
}

# Fonction pour démarrer le frontend
start_frontend() {
    local root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local frontend_path="$root_path/frontend"
    
    if ! [ -d "$frontend_path" ]; then
        print_error "Dossier frontend non trouvé: $frontend_path"
        return 1
    fi
    
    # Vérifier si le frontend est déjà en cours d'exécution
    if test_port 3000; then
        print_success "Le frontend est déjà en cours d'exécution sur le port 3000"
        return 0
    fi
    
    print_info "Démarrage du frontend..."
    
    # Vérifier si les dépendances sont installées
    if ! [ -d "$frontend_path/node_modules" ]; then
        print_info "Installation des dépendances du frontend..."
        cd "$frontend_path" && npm install
    fi
    
    # Démarrer le frontend
    cd "$frontend_path"
    print_info "Le frontend va s'ouvrir dans votre navigateur..."
    npm start &
    local frontend_pid=$!
    
    # Attendre que le frontend démarre
    sleep 5
    
    if test_port 3000; then
        print_success "Frontend démarré avec succès (PID: $frontend_pid)"
        return 0
    else
        print_error "Échec du démarrage du frontend"
        return 1
    fi
}

# Script principal
print_title "DÉMARRAGE DE SNAKE ARENA 🐍"

# Démarrer MongoDB
start_mongodb

# Démarrer le backend
start_backend

# Démarrer le frontend
start_frontend

# Afficher les informations finales
echo ""
print_success "Snake Arena est prêt !"
print_info "Frontend: http://localhost:3000"
print_info "Backend: http://localhost:5000"
print_info "MongoDB: localhost:27017"
echo ""
print_info "Pour arrêter les services, utilisez Ctrl+C ou fermez ce terminal"

# Garder le script actif
wait 