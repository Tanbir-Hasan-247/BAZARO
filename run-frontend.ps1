Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting BAZARO Frontend (React/Vite)  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Web Store: http://localhost:5173/" -ForegroundColor Green
Write-Host ""

npm run dev
