# Fonction pour vérifier si un port est utilisé
function Test-PortInUse {
    param($port)
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Fonction pour démarrer MongoDB de manière robuste
function Start-MongoDB {
    Write-Host "Vérification de MongoDB..." -ForegroundColor Cyan
    
    if (Test-PortInUse 27017) {
        Write-Host "✅ MongoDB est déjà en cours d'exécution sur le port 27017" -ForegroundColor Green
        return $true
    }
    
    Write-Host "Tentative de démarrage de MongoDB..." -ForegroundColor Yellow
    
    try {
        # Essayer de démarrer le service MongoDB Windows
        if (Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue) {
            Start-Service -Name "MongoDB" -ErrorAction Stop
            Start-Sleep -Seconds 3
        }
        # Essayer avec le nom de service alternatif
        elseif (Get-Service -Name "mongod" -ErrorAction SilentlyContinue) {
            Start-Service -Name "mongod" -ErrorAction Stop
            Start-Sleep -Seconds 3
        }
        # Si aucun service n'est trouvé, essayer de lancer mongod directement
        elseif (Get-Command mongod -ErrorAction SilentlyContinue) {
            Start-Process mongod -WindowStyle Hidden
            Start-Sleep -Seconds 3
        }
        else {
            Write-Host "⚠️  MongoDB n'est pas installé en tant que service Windows" -ForegroundColor Yellow
            Write-Host "ℹ️  Veuillez démarrer MongoDB manuellement ou utiliser MongoDB Atlas" -ForegroundColor Cyan
            return $false
        }
        
        # Vérifier si MongoDB est maintenant accessible
        if (Test-PortInUse 27017) {
            Write-Host "✅ MongoDB démarré avec succès" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  MongoDB n'a pas pu être démarré automatiquement" -ForegroundColor Yellow
            Write-Host "ℹ️  Veuillez vérifier l'installation ou utiliser MongoDB Atlas" -ForegroundColor Cyan
            return $false
        }
    }
    catch {
        Write-Host "⚠️  Erreur lors du démarrage de MongoDB: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "ℹ️  Veuillez démarrer MongoDB manuellement ou utiliser MongoDB Atlas" -ForegroundColor Cyan
        return $false
    }
}

# Démarrer MongoDB
Start-MongoDB

# Définir les chemins
$rootPath = $PSScriptRoot
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"

# Fonction pour démarrer le backend
function Start-Backend {
    if (Test-PortInUse 5000) {
        Write-Host "✅ Le backend est déjà en cours d'exécution sur le port 5000" -ForegroundColor Green
        return $true
    }
    
    Write-Host "Démarrage du backend..." -ForegroundColor Cyan
    
    # Vérifier si le dossier backend existe
    if (-not (Test-Path $backendPath)) {
        Write-Host "❌ Dossier backend non trouvé: $backendPath" -ForegroundColor Red
        return $false
    }
    
    # Vérifier si npm est installé
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "❌ npm n'est pas installé. Veuillez installer Node.js" -ForegroundColor Red
        return $false
    }
    
    # Vérifier si les dépendances sont installées
    if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
        Write-Host "ℹ️  Installation des dépendances du backend..." -ForegroundColor Cyan
        cd $backendPath
        npm install
        cd $rootPath
    }
    
    # Démarrer le backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start"
    Start-Sleep -Seconds 3
    
    if (Test-PortInUse 5000) {
        Write-Host "✅ Backend démarré avec succès" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Échec du démarrage du backend" -ForegroundColor Red
        return $false
    }
}

# Fonction pour démarrer le frontend
function Start-Frontend {
    if (Test-PortInUse 3000) {
        Write-Host "✅ Le frontend est déjà en cours d'exécution sur le port 3000" -ForegroundColor Green
        return $true
    }
    
    Write-Host "Démarrage du frontend..." -ForegroundColor Cyan
    
    # Vérifier si le dossier frontend existe
    if (-not (Test-Path $frontendPath)) {
        Write-Host "❌ Dossier frontend non trouvé: $frontendPath" -ForegroundColor Red
        return $false
    }
    
    # Vérifier si les dépendances sont installées
    if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
        Write-Host "ℹ️  Installation des dépendances du frontend..." -ForegroundColor Cyan
        cd $frontendPath
        npm install
        cd $rootPath
    }
    
    # Démarrer le frontend
    Write-Host "ℹ️  Le frontend va s'ouvrir dans votre navigateur..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start"
    Start-Sleep -Seconds 5
    
    if (Test-PortInUse 3000) {
        Write-Host "✅ Frontend démarré avec succès" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Échec du démarrage du frontend" -ForegroundColor Red
        return $false
    }
}

# Démarrer les services
Start-Backend
Start-Frontend

Write-Host "`nSnake Arena est prêt !" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "MongoDB: localhost:27017" -ForegroundColor Cyan 