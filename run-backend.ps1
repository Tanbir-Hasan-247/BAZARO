Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting BAZARO Backend (Django API)   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Setting up Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & (Join-Path $backendDir "venv\Scripts\pip.exe") install -r requirements.txt
    & $venvPython manage.py migrate
    & $venvPython seed_data.py
}

Write-Host "Backend API:    http://127.0.0.1:8000/api/v1/" -ForegroundColor Green
Write-Host "Swagger Docs:   http://127.0.0.1:8000/swagger/" -ForegroundColor Green
Write-Host "Django Admin:   http://127.0.0.1:8000/admin/" -ForegroundColor Green
Write-Host ""

& $venvPython manage.py runserver 127.0.0.1:8000
