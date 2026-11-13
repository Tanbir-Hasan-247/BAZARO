@echo off
title BAZARO Android App
echo =========================================
echo   Starting BAZARO Mobile App (Expo)
echo =========================================
cd /d "%~dp0android"
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)
echo Starting Expo bundler...
echo Scan the terminal QR code with Expo Go on your mobile phone.
echo.
npm start
pause
