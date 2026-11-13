@echo off
title BAZARO Backend
echo =========================================
echo   Starting BAZARO Backend (Django API)
echo =========================================
cd /d "%~dp0backend"
if not exist "venv\Scripts\python.exe" (
    echo Virtual environment not found. Setting up...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    python manage.py migrate
    python seed_data.py
) else (
    call venv\Scripts\activate.bat
)
echo Backend API live at: http://127.0.0.1:8000/api/v1/
echo Swagger documentation: http://127.0.0.1:8000/swagger/
echo Django Admin: http://127.0.0.1:8000/admin/
echo.
python manage.py runserver 127.0.0.1:8000
pause
