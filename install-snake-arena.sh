#!/bin/bash

# ============================================================================
# SCRIPT D'INSTALLATION AUTOMATIQUE - SNAKE ARENA 🐍
# ============================================================================
# Ce script vérifie et installe automatiquement tous les prérequis requis
# pour faire fonctionner la plateforme Snake Arena sur Linux/Mac.
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration des versions minimales requises
REQUIRED_NODE_VERSION="18.0.0"
REQUIRED_MONGO_VERSION="6.0.0"

# Options
FORCE=false
SKIP_MONGO=false
HELP=false

# Analyse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --skip-mongo)
            SKIP_MONGO=true
            shift
            ;;
        --help|-h)
            HELP=true
            shift
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $1${NC}"
            exit 1
            ;;
    esac
done

# Fonction d'aide
show_help() {
    cat << EOF

🐍 SCRIPT D'INSTALLATION SNAKE ARENA 🐍

Usage: $0 [OPTIONS]

Options:
    --force      : Force la réinstallation même si les composants existent
    --skip-mongo : Ignore l'installation MongoDB (si vous utilisez MongoDB Atlas)
    --help, -h   : Affiche cette aide

Exemples:
    $0                    # Installation normale
    $0 --force            # Réinstallation complète
    $0 --skip-mongo       # Sans MongoDB local

EOF
}

if [[ "$HELP" == true ]]; then
    show_help
    exit 0
fi

# Fonctions d'affichage
print_title() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

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

# Fonction pour comparer les versions
version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    # Compléter avec des zéros si nécessaire
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

# Fonction pour vérifier si un port est utilisé
test_port() {
    local port=$1
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
    elif command -v netstat &> /dev/null; then
        netstat -ln | grep ":$port " > /dev/null 2>&1
    else
        return 1
    fi
}

# Détection du système d'exploitation
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# Installation de Node.js
install_nodejs() {
    print_title "VÉRIFICATION DE NODE.JS"
    
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        print_info "Node.js détecté: v$node_version"
        
        version_compare "$node_version" "$REQUIRED_NODE_VERSION"
        case $? in
            0|1) 
                print_success "Node.js version $node_version est compatible (>= $REQUIRED_NODE_VERSION)"
                return 0
                ;;
            2)
                print_warning "Node.js version $node_version est trop ancienne (requis: >= $REQUIRED_NODE_VERSION)"
                if [[ "$FORCE" != true ]]; then
                    read -p "Voulez-vous mettre à jour Node.js ? (o/N): " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
                        print_warning "Installation annulée par l'utilisateur"
                        return 1
                    fi
                fi
                ;;
        esac
    fi
    
    print_info "Installation de Node.js v$REQUIRED_NODE_VERSION..."
    
    local os=$(detect_os)
    case $os in
        linux)
            # Utiliser NodeSource pour Ubuntu/Debian
            if command -v apt-get &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command -v yum &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install nodejs npm -y
            else
                print_error "Gestionnaire de paquets non supporté. Veuillez installer Node.js manuellement."
                return 1
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install node@18
            else
                print_error "Homebrew requis pour installer Node.js sur macOS. Installez-le depuis https://brew.sh/"
                return 1
            fi
            ;;
        *)
            print_error "Système non supporté. Veuillez installer Node.js manuellement."
            return 1
            ;;
    esac
    
    # Vérifier l'installation
    if command -v node &> /dev/null; then
        print_success "Node.js installé avec succès: $(node --version)"
        return 0
    else
        print_error "Échec de l'installation de Node.js"
        return 1
    fi
}

# Installation de MongoDB
install_mongodb() {
    if [[ "$SKIP_MONGO" == true ]]; then
        print_info "Installation MongoDB ignorée (option --skip-mongo)"
        return 0
    fi
    
    print_title "VÉRIFICATION DE MONGODB"
    
    if command -v mongod &> /dev/null; then
        local mongo_version=$(mongod --version | grep "db version" | sed 's/.*v\([0-9]*\.[0-9]*\.[0-9]*\).*/\1/')
        if [[ -n "$mongo_version" ]]; then
            print_info "MongoDB détecté: v$mongo_version"
            version_compare "$mongo_version" "$REQUIRED_MONGO_VERSION"
            if [[ $? -le 1 ]]; then
                print_success "MongoDB version $mongo_version est compatible"
                return 0
            fi
        fi
    fi
    
    print_info "Installation de MongoDB Community Server..."
    
    local os=$(detect_os)
    case $os in
        linux)
            # Ubuntu/Debian
            if command -v apt-get &> /dev/null; then
                wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
                echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                sudo apt-get update
                sudo apt-get install -y mongodb-org
                
                # Démarrer et activer le service
                sudo systemctl start mongod
                sudo systemctl enable mongod
            # CentOS/RHEL
            elif command -v yum &> /dev/null; then
                cat > /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
                sudo yum install -y mongodb-org
                sudo systemctl start mongod
                sudo systemctl enable mongod
            else
                print_error "Gestionnaire de paquets non supporté pour MongoDB"
                return 1
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew tap mongodb/brew
                brew install mongodb-community@6.0
                brew services start mongodb/brew/mongodb-community
            else
                print_error "Homebrew requis pour installer MongoDB sur macOS"
                return 1
            fi
            ;;
        *)
            print_error "Système non supporté pour MongoDB"
            return 1
            ;;
    esac
    
    print_success "MongoDB installé et configuré"
    return 0
}

# Installation de Git
install_git() {
    print_title "VÉRIFICATION DE GIT"
    
    if command -v git &> /dev/null; then
        print_success "Git est déjà installé: $(git --version)"
        return 0
    fi
    
    print_info "Installation de Git..."
    
    local os=$(detect_os)
    case $os in
        linux)
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y git
            elif command -v yum &> /dev/null; then
                sudo yum install -y git
            else
                print_error "Impossible d'installer Git automatiquement"
                return 1
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install git
            else
                print_error "Homebrew requis pour installer Git sur macOS"
                return 1
            fi
            ;;
        *)
            print_error "Système non supporté pour Git"
            return 1
            ;;
    esac
    
    print_success "Git installé avec succès"
    return 0
}

# Installation des dépendances du projet
install_project_dependencies() {
    print_title "INSTALLATION DES DÉPENDANCES DU PROJET"
    
    local root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local backend_path="$root_path/backend"
    local frontend_path="$root_path/frontend"
    
    # Vérifier l'existence des répertoires
    if [[ ! -d "$backend_path" ]]; then
        print_error "Répertoire backend introuvable: $backend_path"
        return 1
    fi
    
    if [[ ! -d "$frontend_path" ]]; then
        print_error "Répertoire frontend introuvable: $frontend_path"
        return 1
    fi
    
    # Installation des dépendances backend
    print_info "Installation des dépendances backend..."
    cd "$backend_path"
    if npm install; then
        print_success "Dépendances backend installées"
    else
        print_error "Échec de l'installation des dépendances backend"
        return 1
    fi
    
    # Installation des dépendances frontend
    print_info "Installation des dépendances frontend..."
    cd "$frontend_path"
    if npm install; then
        print_success "Dépendances frontend installées"
    else
        print_error "Échec de l'installation des dépendances frontend"
        return 1
    fi
    
    cd "$root_path"
    return 0
}

# Vérification de la configuration
test_configuration() {
    print_title "VÉRIFICATION DE LA CONFIGURATION"
    
    local config_errors=()
    local root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Vérifier les fichiers de configuration
    local required_files=(
        "backend/package.json"
        "frontend/package.json"
        "backend/server.js"
        "backend/mongo.env"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$root_path/$file" ]]; then
            config_errors+=("Fichier manquant: $file")
        fi
    done
    
    # Vérifier la connectivité MongoDB
    if [[ "$SKIP_MONGO" != true ]]; then
        if ! test_port 27017; then
            config_errors+=("MongoDB n'est pas accessible sur le port 27017")
        fi
    fi
    
    if [[ ${#config_errors[@]} -gt 0 ]]; then
        print_warning "Problèmes de configuration détectés:"
        for error in "${config_errors[@]}"; do
            echo -e "  ${YELLOW}• $error${NC}"
        done
        return 1
    fi
    
    print_success "Configuration vérifiée avec succès"
    return 0
}

# Démarrage des services
start_snake_arena() {
    print_title "DÉMARRAGE DE SNAKE ARENA"
    
    local root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local backend_path="$root_path/backend"
    local frontend_path="$root_path/frontend"
    
    # Démarrer MongoDB si nécessaire
    if [[ "$SKIP_MONGO" != true ]]; then
        if ! test_port 27017; then
            print_info "Démarrage de MongoDB..."
            local os=$(detect_os)
            case $os in
                linux)
                    sudo systemctl start mongod || print_warning "Impossible de démarrer MongoDB automatiquement"
                    ;;
                macos)
                    brew services start mongodb/brew/mongodb-community || print_warning "Impossible de démarrer MongoDB automatiquement"
                    ;;
            esac
            sleep 3
        else
            print_success "MongoDB est déjà en cours d'exécution"
        fi
    fi
    
    # Démarrer le backend
    if test_port 5000; then
        print_success "Backend déjà en cours d'exécution sur le port 5000"
    else
        print_info "Démarrage du backend..."
        cd "$backend_path"
        npm start &
        sleep 3
    fi
    
    # Démarrer le frontend
    if test_port 3000; then
        print_success "Frontend déjà en cours d'exécution sur le port 3000"
    else
        print_info "Démarrage du frontend..."
        cd "$frontend_path"
        npm start &
        sleep 3
    fi
    
    cd "$root_path"
    
    echo -e "\n${GREEN}🎉 SNAKE ARENA EST PRÊT ! 🎉${NC}"
    echo -e "\n${CYAN}Accès à l'application:${NC}"
    echo -e "  ${BLUE}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "  ${BLUE}🔧 Backend:  http://localhost:5000${NC}"
    if [[ "$SKIP_MONGO" != true ]]; then
        echo -e "  ${BLUE}🗄️  MongoDB:  localhost:27017${NC}"
    fi
    echo -e "\n${YELLOW}Pour arrêter les services, utilisez Ctrl+C dans les terminaux correspondants.${NC}"
}

# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

cat << "EOF"

🐍 ============================================== 🐍
   INSTALLATION AUTOMATIQUE - SNAKE ARENA
🐍 ============================================== 🐍

EOF

installation_success=true

# 1. Installer Node.js
if ! install_nodejs; then
    installation_success=false
fi

# 2. Installer Git
if ! install_git; then
    print_warning "Git n'a pas pu être installé, mais ce n'est pas critique pour le fonctionnement"
fi

# 3. Installer MongoDB
if ! install_mongodb; then
    installation_success=false
fi

# 4. Installer les dépendances du projet
if [[ "$installation_success" == true ]]; then
    if ! install_project_dependencies; then
        installation_success=false
    fi
fi

# 5. Vérifier la configuration
if [[ "$installation_success" == true ]]; then
    if ! test_configuration; then
        installation_success=false
    fi
fi

# 6. Démarrer l'application si tout s'est bien passé
if [[ "$installation_success" == true ]]; then
    echo -e "\n${GREEN}Installation terminée avec succès ! 🎉${NC}"
    read -p "Voulez-vous démarrer Snake Arena maintenant ? [O/n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_snake_arena
    else
        print_info "Pour démarrer Snake Arena plus tard, utilisez: ./start-snake-arena.sh (à créer) ou les commandes npm start dans chaque dossier"
    fi
else
    print_error "L'installation s'est terminée avec des erreurs."
    print_info "Veuillez corriger les problèmes ci-dessus et relancer le script."
    exit 1
fi

echo -e "\n${MAGENTA}Merci d'avoir utilisé le script d'installation Snake Arena ! 🐍${NC}"