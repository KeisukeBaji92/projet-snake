# ============================================================================
# SCRIPT D'INSTALLATION UNIVERSEL - SNAKE ARENA 🐍
# ============================================================================
# Ce script detecte automatiquement votre systeme d'exploitation et lance
# le script d'installation approprie pour Snake Arena.
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
    Blue    = 'Blue'
}

function Write-Title {
    param($Title)
    Write-Host "`n" + "="*70 -ForegroundColor $Colors.Blue
    Write-Host "  $Title" -ForegroundColor $Colors.Cyan
    Write-Host "="*70 -ForegroundColor $Colors.Blue
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Cyan
}

function Show-Help {
    Write-Host @"
    
🐍 SCRIPT D'INSTALLATION UNIVERSEL SNAKE ARENA 🐍

Ce script detecte automatiquement votre OS et lance l'installation appropriee.

Usage: .\install.ps1 [OPTIONS]

Options:
    -Force      : Force la reinstallation meme si les composants existent
    -SkipMongo  : Ignore l'installation MongoDB (si vous utilisez MongoDB Atlas)
    -Help       : Affiche cette aide

Exemples:
    .\install.ps1                    # Installation automatique
    .\install.ps1 -Force             # Reinstallation complete
    .\install.ps1 -SkipMongo         # Sans MongoDB local

Systemes supportes:
    - Windows 10/11 (PowerShell)
    - Linux (Ubuntu, Debian, CentOS, RHEL)
    - macOS (avec Homebrew)

"@ -ForegroundColor $Colors.Cyan
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Title "DETECTION DU SYSTEME D'EXPLOITATION"

# Detecter l'OS
$OS = $null
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    $OS = "Windows"
} elseif ($IsLinux) {
    $OS = "Linux"
} elseif ($IsMacOS) {
    $OS = "macOS"
} else {
    # Fallback pour PowerShell 5.1 sur Windows
    if ([System.Environment]::OSVersion.Platform -eq "Win32NT") {
        $OS = "Windows"
    } else {
        $OS = "Unknown"
    }
}

Write-Info "Systeme detecte: $OS"

# Lancer le script approprie
switch ($OS) {
    "Windows" {
        Write-Info "Lancement du script d installation Windows..."
        $scriptPath = Join-Path $PSScriptRoot "install-snake-arena.ps1"
        if (Test-Path $scriptPath) {
            $params = @()
            if ($Force) { $params += "-Force" }
            if ($SkipMongo) { $params += "-SkipMongo" }
            
            & $scriptPath @params
        } else {
            Write-Error "Script d installation Windows non trouve: $scriptPath"
            exit 1
        }
    }
    
    "Linux" {
        Write-Info "Lancement du script d installation Linux..."
        $scriptPath = Join-Path $PSScriptRoot "install-snake-arena.sh"
        if (Test-Path $scriptPath) {
            chmod +x $scriptPath
            $params = @()
            if ($Force) { $params += "--force" }
            if ($SkipMongo) { $params += "--skip-mongo" }
            
            & bash $scriptPath @params
        } else {
            Write-Error "Script d installation Linux non trouve: $scriptPath"
            exit 1
        }
    }
    
    "macOS" {
        Write-Info "Lancement du script d installation macOS..."
        $scriptPath = Join-Path $PSScriptRoot "install-snake-arena.sh"
        if (Test-Path $scriptPath) {
            chmod +x $scriptPath
            $params = @()
            if ($Force) { $params += "--force" }
            if ($SkipMongo) { $params += "--skip-mongo" }
            
            & bash $scriptPath @params
        } else {
            Write-Error "Script d installation macOS non trouve: $scriptPath"
            exit 1
        }
    }
    
    default {
        Write-Error "Systeme d exploitation non supporte: $OS"
        Write-Info "Systemes supportes: Windows, Linux, macOS"
        Write-Info "Veuillez utiliser directement le script approprie:"
        Write-Info "  - Windows: .\install-snake-arena.ps1"
        Write-Info "  - Linux/Mac: ./install-snake-arena.sh"
        exit 1
    }
}

Write-Success "Installation terminee !"
Write-Info "Utilisez maintenant le script de demarrage:"
Write-Info "  - Windows: .\start-snake-arena.ps1"
Write-Info "  - Linux/Mac: ./start-snake-arena.sh" 