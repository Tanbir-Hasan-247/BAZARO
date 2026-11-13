@echo off
title BAZARO Frontend
echo =========================================
echo   Starting BAZARO Frontend (React + Vite)
echo =========================================
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)
echo Frontend Store live at: http://localhost:5173/
echo.
npm run dev
pause
