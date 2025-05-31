# Fonction pour vérifier si un port est utilisé
function Test-PortInUse {
    param($port)
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Vérifier si MongoDB est en cours d'exécution (port par défaut : 27017)
if (-not (Test-PortInUse 27017)) {
    Write-Host "MongoDB n'est pas démarré. Démarrage de MongoDB..." -ForegroundColor Yellow
    Start-Service MongoDB
    Start-Sleep -Seconds 2
}

# Définir les chemins
$rootPath = $PSScriptRoot
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"

# Vérifier si le backend est déjà en cours d'exécution
if (Test-PortInUse 5000) {
    Write-Host "Le backend est déjà en cours d'exécution sur le port 5000" -ForegroundColor Green
} else {
    Write-Host "Démarrage du backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start"
    Start-Sleep -Seconds 2
}

# Vérifier si le frontend est déjà en cours d'exécution
if (Test-PortInUse 3000) {
    Write-Host "Le frontend est déjà en cours d'exécution sur le port 3000" -ForegroundColor Green
} else {
    Write-Host "Démarrage du frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start"
}

Write-Host "`nSnake Arena est prêt !" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "MongoDB: localhost:27017" -ForegroundColor Cyan 