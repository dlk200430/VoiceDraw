@echo off
echo ================================
echo   VoiceDraw - AI Voice Drawing
echo ================================
echo.
cd /d "%~dp0server"
echo Installing dependencies...
call npm install --silent
echo.
echo Starting server at http://localhost:3000
echo.
call npm start
pause
