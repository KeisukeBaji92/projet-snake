# ============================================================================
# SCRIPT D'INSTALLATION AUTOMATIQUE - SNAKE ARENA 🐍
# ============================================================================
# Ce script vérifie et installe automatiquement tous les prérequis requis
# pour faire fonctionner la plateforme Snake Arena sur Windows.
# ============================================================================

param(
    [switch]$Force,
    [switch]$SkipMongo,
    [switch]$Help
)

# Couleurs pour l'affichage
$Colors = @{
    Green   = 'Green'
    Red     = 'Red'
    Yellow  = 'Yellow'
    Cyan    = 'Cyan'
    Magenta = 'Magenta'
    Blue    = 'Blue'
}

# Configuration des versions minimales requises
$RequiredVersions = @{
    NodeJS = '18.0.0'
    MongoDB = '6.0.0'
}

# Fonction d'aide
function Show-Help {
    Write-Host @"
    
🐍 SCRIPT D'INSTALLATION SNAKE ARENA 🐍

Usage: .\install-snake-arena.ps1 [OPTIONS]

Options:
    -Force      : Force la réinstallation même si les composants existent
    -SkipMongo  : Ignore l'installation MongoDB (si vous utilisez MongoDB Atlas)
    -Help       : Affiche cette aide

Exemples:
    .\install-snake-arena.ps1                    # Installation normale
    .\install-snake-arena.ps1 -Force             # Réinstallation complète
    .\install-snake-arena.ps1 -SkipMongo         # Sans MongoDB local

"@ -ForegroundColor $Colors.Cyan
}

if ($Help) {
    Show-Help
    exit 0
}

# Fonction pour afficher un titre
function Write-Title {
    param($Title)
    Write-Host "`n" + "="*60 -ForegroundColor $Colors.Blue
    Write-Host "  $Title" -ForegroundColor $Colors.Cyan
    Write-Host "="*60 -ForegroundColor $Colors.Blue
}

# Fonction pour afficher un message de succès
function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

# Fonction pour afficher un message d'erreur
function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

# Fonction pour afficher un message d'avertissement
function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

# Fonction pour afficher un message d'information
function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Cyan
}

# Fonction pour comparer les versions
function Compare-Version {
    param($Version1, $Version2)
    $v1 = [System.Version]$Version1
    $v2 = [System.Version]$Version2
    return $v1.CompareTo($v2)
}

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction Stop
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Fonction pour vérifier les permissions administrateur
function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Fonction pour installer Chocolatey
function Install-Chocolatey {
    Write-Info "Installation de Chocolatey (gestionnaire de paquets Windows)..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Success "Chocolatey installé avec succès"
        return $true
    } catch {
        Write-Error "Échec de l'installation de Chocolatey: $($_.Exception.Message)"
        return $false
    }
}

# Fonction pour vérifier/installer Node.js
function Install-NodeJS {
    Write-Title "VÉRIFICATION DE NODE.JS"
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $nodeVersion = $nodeVersion.TrimStart('v')
            Write-Info "Node.js détecté: v$nodeVersion"
            
            if ((Compare-Version $nodeVersion $RequiredVersions.NodeJS) -ge 0) {
                Write-Success "Node.js version $nodeVersion est compatible (>= $($RequiredVersions.NodeJS))"
                return $true
            } else {
                Write-Warning "Node.js version $nodeVersion est trop ancienne (requis: >= $($RequiredVersions.NodeJS))"
                if (-not $Force) {
                    $response = Read-Host "Voulez-vous mettre à jour Node.js ? (o/N)"
                    if ($response -notmatch '^[oO]$') {
                        Write-Warning "Installation annulée par l'utilisateur"
                        return $false
                    }
                }
            }
        }
    } catch {}
    
    Write-Info "Installation de Node.js v$($RequiredVersions.NodeJS)..."
    
    # Vérifier si Chocolatey est disponible
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Info "Chocolatey requis pour l'installation automatique..."
        if (-not (Install-Chocolatey)) {
            Write-Error "Impossible d'installer Chocolatey. Veuillez installer Node.js manuellement depuis https://nodejs.org/"
            return $false
        }
        # Recharger l'environnement après installation de Chocolatey
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    try {
        choco install nodejs --version=$($RequiredVersions.NodeJS) -y
        # Recharger l'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Vérifier l'installation
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js installé avec succès: $nodeVersion"
            return $true
        } else {
            throw "Node.js n'est pas accessible après installation"
        }
    } catch {
        Write-Error "Échec de l'installation de Node.js: $($_.Exception.Message)"
        Write-Info "Veuillez installer Node.js manuellement depuis https://nodejs.org/"
        return $false
    }
}

# Fonction pour vérifier/installer MongoDB
function Install-MongoDB {
    if ($SkipMongo) {
        Write-Info "Installation MongoDB ignorée (option -SkipMongo)"
        return $true
    }
    
    Write-Title "VÉRIFICATION DE MONGODB"
    
    # Vérifier si MongoDB est installé
    try {
        $mongoVersion = mongod --version 2>$null | Select-String "db version" | ForEach-Object { $_.Line -replace '.*v(\d+\.\d+\.\d+).*', '$1' }
        if ($mongoVersion) {
            Write-Info "MongoDB détecté: v$mongoVersion"
            if ((Compare-Version $mongoVersion $RequiredVersions.MongoDB) -ge 0) {
                Write-Success "MongoDB version $mongoVersion est compatible"
                return $true
            }
        }
    } catch {}
    
    Write-Info "Installation de MongoDB Community Server..."
    
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        if (-not (Install-Chocolatey)) {
            Write-Error "Impossible d'installer MongoDB automatiquement"
            Write-Info "Veuillez installer MongoDB manuellement depuis https://www.mongodb.com/try/download/community"
            return $false
        }
    }
    
    try {
        choco install mongodb -y
        
        # Configurer MongoDB comme service
        Write-Info "Configuration du service MongoDB..."
        
        # Créer les répertoires nécessaires
        $mongoDataPath = "C:\data\db"
        $mongoLogPath = "C:\data\log"
        
        if (-not (Test-Path $mongoDataPath)) {
            New-Item -ItemType Directory -Path $mongoDataPath -Force
        }
        if (-not (Test-Path $mongoLogPath)) {
            New-Item -ItemType Directory -Path $mongoLogPath -Force
        }
        
        # Démarrer le service MongoDB
        Start-Service MongoDB -ErrorAction SilentlyContinue
        Set-Service -Name MongoDB -StartupType Automatic
        
        Write-Success "MongoDB installé et configuré comme service"
        return $true
    } catch {
        Write-Error "Échec de l'installation de MongoDB: $($_.Exception.Message)"
        Write-Info "Vous pouvez utiliser -SkipMongo si vous utilisez MongoDB Atlas"
        return $false
    }
}

# Fonction pour vérifier/installer Git
function Install-Git {
    Write-Title "VÉRIFICATION DE GIT"
    
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Success "Git est déjà installé: $gitVersion"
            return $true
        }
    } catch {}
    
    Write-Info "Installation de Git..."
    
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        if (-not (Install-Chocolatey)) {
            Write-Error "Impossible d'installer Git automatiquement"
            Write-Info "Veuillez installer Git manuellement depuis https://git-scm.com/"
            return $false
        }
    }
    
    try {
        choco install git -y
        # Recharger l'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Success "Git installé avec succès"
        return $true
    } catch {
        Write-Error "Échec de l'installation de Git: $($_.Exception.Message)"
        return $false
    }
}

# Fonction pour installer les dépendances du projet
function Install-ProjectDependencies {
    Write-Title "INSTALLATION DES DÉPENDANCES DU PROJET"
    
    $rootPath = $PSScriptRoot
    $backendPath = Join-Path $rootPath "backend"
    $frontendPath = Join-Path $rootPath "frontend"
    
    # Vérifier l'existence des répertoires
    if (-not (Test-Path $backendPath)) {
        Write-Error "Répertoire backend introuvable: $backendPath"
        return $false
    }
    
    if (-not (Test-Path $frontendPath)) {
        Write-Error "Répertoire frontend introuvable: $frontendPath"
        return $false
    }
    
    # Installation des dépendances backend
    Write-Info "Installation des dépendances backend..."
    try {
        Set-Location $backendPath
        npm install
        Write-Success "Dépendances backend installées"
    } catch {
        Write-Error "Échec de l'installation des dépendances backend: $($_.Exception.Message)"
        return $false
    }
    
    # Installation des dépendances frontend
    Write-Info "Installation des dépendances frontend..."
    try {
        Set-Location $frontendPath
        npm install
        Write-Success "Dépendances frontend installées"
    } catch {
        Write-Error "Échec de l'installation des dépendances frontend: $($_.Exception.Message)"
        return $false
    } finally {
        Set-Location $rootPath
    }
    
    return $true
}

# Fonction pour vérifier la configuration
function Test-Configuration {
    Write-Title "VÉRIFICATION DE LA CONFIGURATION"
    
    $configErrors = @()
    
    # Vérifier les fichiers de configuration
    $requiredFiles = @(
        "backend\package.json",
        "frontend\package.json",
        "backend\server.js",
        "backend\mongo.env"
    )
    
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $PSScriptRoot $file
        if (-not (Test-Path $filePath)) {
            $configErrors += "Fichier manquant: $file"
        }
    }
    
    # Vérifier la connectivité MongoDB
    if (-not $SkipMongo) {
        if (-not (Test-Port 27017)) {
            $configErrors += "MongoDB n'est pas accessible sur le port 27017"
        }
    }
    
    if ($configErrors.Count -gt 0) {
        Write-Warning "Problèmes de configuration détectés:"
        foreach ($error in $configErrors) {
            Write-Host "  • $error" -ForegroundColor $Colors.Yellow
        }
        return $false
    }
    
    Write-Success "Configuration vérifiée avec succès"
    return $true
}

# Fonction pour démarrer les services
function Start-SnakeArena {
    Write-Title "DÉMARRAGE DE SNAKE ARENA"
    
    $rootPath = $PSScriptRoot
    $backendPath = Join-Path $rootPath "backend"
    $frontendPath = Join-Path $rootPath "frontend"
    
    # Démarrer MongoDB si nécessaire
    if (-not $SkipMongo) {
        if (-not (Test-Port 27017)) {
            Write-Info "Démarrage de MongoDB..."
            try {
                Start-Service MongoDB -ErrorAction Stop
                Start-Sleep -Seconds 3
                Write-Success "MongoDB démarré"
            } catch {
                Write-Warning "Impossible de démarrer le service MongoDB automatiquement"
                Write-Info "Veuillez démarrer MongoDB manuellement"
            }
        } else {
            Write-Success "MongoDB est déjà en cours d'exécution"
        }
    }
    
    # Vérifier si les services sont déjà en cours d'exécution
    if (Test-Port 5000) {
        Write-Success "Backend déjà en cours d'exécution sur le port 5000"
    } else {
        Write-Info "Démarrage du backend..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start" -WindowStyle Normal
        Start-Sleep -Seconds 3
    }
    
    if (Test-Port 3000) {
        Write-Success "Frontend déjà en cours d'exécution sur le port 3000"
    } else {
        Write-Info "Démarrage du frontend..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Normal
        Start-Sleep -Seconds 3
    }
    
    Write-Host "`n" + "🎉 SNAKE ARENA EST PRÊT ! 🎉" -ForegroundColor $Colors.Green
    Write-Host "`nAccès à l'application:" -ForegroundColor $Colors.Cyan
    Write-Host "  🌐 Frontend: http://localhost:3000" -ForegroundColor $Colors.Blue
    Write-Host "  🔧 Backend:  http://localhost:5000" -ForegroundColor $Colors.Blue
    if (-not $SkipMongo) {
        Write-Host "  🗄️  MongoDB:  localhost:27017" -ForegroundColor $Colors.Blue
    }
    Write-Host "`nPour arrêter les services, fermez les fenêtres PowerShell ouvertes." -ForegroundColor $Colors.Yellow
}

# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

Write-Host @"

🐍 ============================================== 🐍
   INSTALLATION AUTOMATIQUE - SNAKE ARENA
🐍 ============================================== 🐍

"@ -ForegroundColor $Colors.Green

# Vérifier les permissions administrateur
if (-not (Test-AdminRights)) {
    Write-Warning "Ce script nécessite des privilèges administrateur pour installer certains composants."
    Write-Info "Veuillez relancer PowerShell en tant qu'administrateur pour une installation complète."
    Write-Host "`nVoulez-vous continuer sans privilèges administrateur ? (certaines installations peuvent échouer) [o/N]: " -NoNewline -ForegroundColor $Colors.Yellow
    $response = Read-Host
    if ($response -notmatch '^[oO]$') {
        Write-Info "Installation annulée. Relancez en tant qu'administrateur pour une installation complète."
        exit 1
    }
}

$installationSuccess = $true

# 1. Installer Node.js
if (-not (Install-NodeJS)) {
    $installationSuccess = $false
}

# 2. Installer Git
if (-not (Install-Git)) {
    Write-Warning "Git n'a pas pu être installé, mais ce n'est pas critique pour le fonctionnement"
}

# 3. Installer MongoDB
if (-not (Install-MongoDB)) {
    $installationSuccess = $false
}

# 4. Installer les dépendances du projet
if ($installationSuccess) {
    if (-not (Install-ProjectDependencies)) {
        $installationSuccess = $false
    }
}

# 5. Vérifier la configuration
if ($installationSuccess) {
    if (-not (Test-Configuration)) {
        $installationSuccess = $false
    }
}

# 6. Démarrer l'application si tout s'est bien passé
if ($installationSuccess) {
    Write-Host "`nInstallation terminée avec succès ! 🎉" -ForegroundColor $Colors.Green
    Write-Host "Voulez-vous démarrer Snake Arena maintenant ? [O/n]: " -NoNewline -ForegroundColor $Colors.Cyan
    $startNow = Read-Host
    if ($startNow -notmatch '^[nN]$') {
        Start-SnakeArena
    } else {
        Write-Info "Pour démarrer Snake Arena plus tard, utilisez: .\start-snake-arena.ps1"
    }
} else {
    Write-Error "L'installation s'est terminée avec des erreurs."
    Write-Info "Veuillez corriger les problèmes ci-dessus et relancer le script."
    exit 1
}

Write-Host "`nMerci d'avoir utilisé le script d'installation Snake Arena ! 🐍" -ForegroundColor $Colors.Magenta