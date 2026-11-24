@echo off
echo ========================================================
echo   Starting PayFlow Frontend (Vite React)...
echo ========================================================
cd /d "%~dp0frontend"
call npm run dev
pause
