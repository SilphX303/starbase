@echo off
REM Starbase one-time setup: cleans stale files, installs deps, creates your user, starts dev server.
cd /d "%~dp0"

echo === Starbase setup ===

if exist .git\config.lock del /f .git\config.lock
if exist .git\index.lock del /f .git\index.lock

if exist node_modules (
	echo Removing stale node_modules...
	rmdir /s /q node_modules
)

echo Installing dependencies...
call npm ci
if errorlevel 1 (
	echo npm ci failed. Is Node.js installed and on PATH?
	pause
	exit /b 1
)

echo.
set /p SB_EMAIL="Email [steve@mcfly.uk]: "
if "%SB_EMAIL%"=="" set SB_EMAIL=steve@mcfly.uk
set /p SB_PASS="Choose a password: "
node scripts\create-user.js %SB_EMAIL% %SB_PASS%

echo.
echo Starting dev server at http://localhost:5173 ...
start "" http://localhost:5173
call npm run dev
pause
