Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "        Starting BAZARO Full-Stack System                " -ForegroundColor Cyan
Write-Host "            (Apnar Desher Bazaar)                        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
$frontendScript = Join-Path $PSScriptRoot "run-frontend.ps1"

Start-Process powershell -ArgumentList "-NoExit", "-File `"$backendScript`""
Start-Process powershell -ArgumentList "-NoExit", "-File `"$frontendScript`""

Write-Host ""
Write-Host "Both servers are launching in separate PowerShell windows!" -ForegroundColor Green
Write-Host "- Web Store:     http://localhost:5173" -ForegroundColor Yellow
Write-Host "- Backend API:   http://127.0.0.1:8000/api/v1/" -ForegroundColor Yellow
Write-Host "- Swagger Docs:  http://127.0.0.1:8000/swagger/" -ForegroundColor Yellow
Write-Host "- Django Admin:  http://127.0.0.1:8000/admin/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "- Admin:    admin@bazaro.com  /  admin123456"
Write-Host "- Customer: user@bazaro.com   /  user123456"
Write-Host "========================================================" -ForegroundColor Cyan
