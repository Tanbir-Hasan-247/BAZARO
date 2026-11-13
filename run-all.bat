@echo off
title BAZARO Full-Stack Launcher
echo ========================================================
echo          Starting BAZARO Full-Stack System
echo            (Apnar Desher Bazaar)
echo ========================================================
echo.
echo [1/2] Launching Backend on http://127.0.0.1:8000 ...
start "BAZARO Backend (Django)" "%~dp0run-backend.bat"

echo [2/2] Launching Frontend on http://localhost:5173 ...
start "BAZARO Frontend (Vite)" "%~dp0run-frontend.bat"

echo.
echo ========================================================
echo Both servers are launching in separate console windows!
echo - Web Store:     http://localhost:5173
echo - Backend API:   http://127.0.0.1:8000/api/v1/
echo - Swagger Docs:  http://127.0.0.1:8000/swagger/
echo - Django Admin:  http://127.0.0.1:8000/admin/
echo.
echo Login Credentials:
echo - Admin:    admin@bazaro.com  /  admin123456
echo - Customer: user@bazaro.com   /  user123456
echo ========================================================
echo.
pause
