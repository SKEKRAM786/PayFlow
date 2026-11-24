@echo off
echo ========================================================
echo   Starting PayFlow Backend (Local Dev Profile)...
echo ========================================================
cd /d "%~dp0backend"
set SPRING_PROFILES_ACTIVE=dev
.\tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=dev
pause
