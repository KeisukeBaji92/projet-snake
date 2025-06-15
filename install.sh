#!/bin/bash

# ============================================================================
# SCRIPT D'INSTALLATION UNIVERSEL - SNAKE ARENA 🐍
# ============================================================================
# Ce script détecte automatiquement votre système d'exploitation et lance
# le script d'installation approprié pour Snake Arena.
# ============================================================================

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Options par défaut
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

# Fonctions d'affichage
print_title() {
    echo -e "\n${BLUE}======================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}======================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Fonction d'aide
show_help() {
    cat << EOF

🐍 SCRIPT D'INSTALLATION UNIVERSEL SNAKE ARENA 🐍

Ce script détecte automatiquement votre OS et lance l'installation appropriée.

Usage: $0 [OPTIONS]

Options:
    --force      : Force la réinstallation même si les composants existent
    --skip-mongo : Ignore l'installation MongoDB (si vous utilisez MongoDB Atlas)
    --help, -h   : Affiche cette aide

Exemples:
    $0                    # Installation automatique
    $0 --force            # Réinstallation complète
    $0 --skip-mongo       # Sans MongoDB local

Systèmes supportés:
    - Linux (Ubuntu, Debian, CentOS, RHEL, Fedora)
    - macOS (avec Homebrew)
    - Windows (via WSL)

EOF
}

if [[ "$HELP" == true ]]; then
    show_help
    exit 0
fi

# Fonction pour détecter l'OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
        echo "Windows"
    else
        echo "Unknown"
    fi
}

print_title "DÉTECTION DU SYSTÈME D'EXPLOITATION"

OS=$(detect_os)
print_info "Système détecté: $OS"

# Vérifier si le script d'installation spécifique existe
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_SCRIPT="$SCRIPT_DIR/install-snake-arena.sh"

if [[ ! -f "$INSTALL_SCRIPT" ]]; then
    print_error "Script d'installation non trouvé: $INSTALL_SCRIPT"
    print_info "Assurez-vous que le fichier install-snake-arena.sh est présent dans le même dossier"
    exit 1
fi

# Rendre le script exécutable
chmod +x "$INSTALL_SCRIPT"

# Construire les paramètres à passer au script d'installation
PARAMS=()
if [[ "$FORCE" == true ]]; then
    PARAMS+=("--force")
fi
if [[ "$SKIP_MONGO" == true ]]; then
    PARAMS+=("--skip-mongo")
fi

# Lancer le script d'installation approprié
case $OS in
    "Linux"|"macOS"|"Windows")
        print_info "Lancement du script d'installation pour $OS..."
        exec "$INSTALL_SCRIPT" "${PARAMS[@]}"
        ;;
    *)
        print_error "Système d'exploitation non supporté: $OS"
        print_info "Systèmes supportés: Linux, macOS, Windows (WSL)"
        print_info "Veuillez utiliser directement le script approprié:"
        print_info "  - Linux/Mac/WSL: ./install-snake-arena.sh"
        exit 1
        ;;
esac 