# ============================================================================
# SCRIPT D'INSTALLATION SIMPLE - SNAKE ARENA
# ============================================================================
# Ce script lance automatiquement l'installation pour Windows
# ============================================================================

param(
    [switch]$Force,
    [switch]$SkipMongo,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\install-simple.ps1 [OPTIONS]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Force      : Force la reinstallation" -ForegroundColor Cyan
    Write-Host "  -SkipMongo  : Ignore MongoDB" -ForegroundColor Cyan
    Write-Host "  -Help       : Affiche cette aide" -ForegroundColor Cyan
    exit 0
}

Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "  INSTALLATION SNAKE ARENA - WINDOWS" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Blue

Write-Host "Systeme detecte: Windows" -ForegroundColor Cyan

# Verifier si le script d'installation existe
$scriptPath = Join-Path $PSScriptRoot "install-snake-arena.ps1"
if (Test-Path $scriptPath) {
    Write-Host "Lancement du script d'installation Windows..." -ForegroundColor Cyan
    
    $params = @()
    if ($Force) { $params += "-Force" }
    if ($SkipMongo) { $params += "-SkipMongo" }
    
    & $scriptPath @params
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installation terminee avec succes !" -ForegroundColor Green
        Write-Host "Utilisez maintenant: .\start-snake-arena.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "Erreur lors de l'installation" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Erreur: Script install-snake-arena.ps1 non trouve" -ForegroundColor Red
    Write-Host "Chemin recherche: $scriptPath" -ForegroundColor Yellow
    exit 1
} 