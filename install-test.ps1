# ============================================================================
# SCRIPT D'INSTALLATION TEST - SNAKE ARENA
# ============================================================================
# Script simple et robuste pour installation sur machines de test
# ============================================================================

param(
    [switch]$SkipMongo
)

Write-Host "=============================================================================" -ForegroundColor Blue
Write-Host "  INSTALLATION SNAKE ARENA - VERSION TEST" -ForegroundColor Cyan  
Write-Host "=============================================================================" -ForegroundColor Blue

$ErrorActionPreference = "Continue"

# Fonction pour tester si Node.js est installe
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "Node.js detecte: $nodeVersion" -ForegroundColor Green
            return $true
        }
    } catch {}
    return $false
}

# Fonction pour installer Node.js via chocolatey
function Install-NodeJS {
    Write-Host "Installation de Node.js..." -ForegroundColor Yellow
    
    # Verifier si chocolatey est installe
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Installation de Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        try {
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            Write-Host "Chocolatey installe avec succes" -ForegroundColor Green
        } catch {
            Write-Host "Echec installation Chocolatey. Installez Node.js manuellement depuis https://nodejs.org/" -ForegroundColor Red
            return $false
        }
        # Recharger PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    # Installer Node.js
    try {
        choco install nodejs -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "Node.js installe avec succes" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Echec installation Node.js via Chocolatey" -ForegroundColor Red
        return $false
    }
}

# Fonction pour tester MongoDB
function Test-MongoDB {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Fonction pour installer les dependances npm
function Install-Dependencies {
    Write-Host "Installation des dependances du projet..." -ForegroundColor Yellow
    
    $rootPath = $PSScriptRoot
    $backendPath = Join-Path $rootPath "backend"
    $frontendPath = Join-Path $rootPath "frontend"
    
    # Backend
    if (Test-Path $backendPath) {
        Write-Host "Installation dependances backend..." -ForegroundColor Cyan
        Set-Location $backendPath
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Backend dependencies OK" -ForegroundColor Green
        } else {
            Write-Host "Erreur installation backend" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "Dossier backend non trouve!" -ForegroundColor Red
        return $false
    }
    
    # Frontend  
    if (Test-Path $frontendPath) {
        Write-Host "Installation dependances frontend..." -ForegroundColor Cyan
        Set-Location $frontendPath
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Frontend dependencies OK" -ForegroundColor Green
        } else {
            Write-Host "Erreur installation frontend" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "Dossier frontend non trouve!" -ForegroundColor Red
        return $false
    }
    
    Set-Location $rootPath
    return $true
}

# ============================================================================
# EXECUTION PRINCIPALE
# ============================================================================

Write-Host "Debut de l'installation..." -ForegroundColor Cyan

# 1. Verifier/installer Node.js
if (-not (Test-NodeJS)) {
    if (-not (Install-NodeJS)) {
        Write-Host "ECHEC: Impossible d'installer Node.js" -ForegroundColor Red
        Write-Host "Veuillez installer Node.js manuellement depuis https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Reverifier Node.js apres installation
if (-not (Test-NodeJS)) {
    Write-Host "ECHEC: Node.js non accessible apres installation" -ForegroundColor Red
    exit 1
}

# 2. Verifier MongoDB (optionnel)
if (-not $SkipMongo) {
    if (Test-MongoDB) {
        Write-Host "MongoDB detecte et accessible" -ForegroundColor Green
    } else {
        Write-Host "ATTENTION: MongoDB non detecte sur port 27017" -ForegroundColor Yellow
        Write-Host "Vous pouvez utiliser MongoDB Atlas ou installer MongoDB manuellement" -ForegroundColor Yellow
    }
}

# 3. Installer les dependances
if (-not (Install-Dependencies)) {
    Write-Host "ECHEC: Probleme avec les dependances npm" -ForegroundColor Red
    exit 1
}

# 4. Verification finale
Write-Host "=============================================================================" -ForegroundColor Blue
Write-Host "  INSTALLATION TERMINEE AVEC SUCCES" -ForegroundColor Green
Write-Host "=============================================================================" -ForegroundColor Blue

Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Demarrer avec: .\start-snake-arena.ps1" -ForegroundColor White
Write-Host "2. Ou demarrer manuellement:" -ForegroundColor White
Write-Host "   - Backend: cd backend && npm start" -ForegroundColor White  
Write-Host "   - Frontend: cd frontend && npm start" -ForegroundColor White
Write-Host ""
Write-Host "URLs d'acces:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend: http://localhost:5000" -ForegroundColor White

Write-Host ""
Write-Host "Installation reussie!" -ForegroundColor Green 