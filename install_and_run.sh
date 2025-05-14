# Vérification de la présence de node
if ! command -v node &> /dev/null; then
    echo "🚨 Node.js n'est pas installé sur votre système."
    echo -n "❓ Souhaitez-vous l'installer maintenant ? (y/n) : "
    read -r reponse
    if [[ "$reponse" =~ ^[Yy]$ ]]; then
        echo "🚀 Installation de Node.js en cours..."

        # Détection du système
        OS=$(uname)
        if [[ "$OS" == "Linux" ]]; then
            # Installation pour Linux (Debian/Ubuntu)
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OS" == "Darwin" ]]; then
            # Installation pour macOS (via Homebrew)
            if ! command -v brew &> /dev/null; then
                echo "❌ Homebrew n'est pas installé. Veuillez l'installer manuellement depuis https://brew.sh/"
                exit 1
            fi
            brew install node
        else
            echo "❌ Système non reconnu. Veuillez installer Node.js manuellement."
            exit 1
        fi
    else
        echo "⛔ Installation de Node.js annulée. Le script ne peut pas continuer."
        exit 1
    fi
fi
