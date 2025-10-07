@echo off
REM Production Deployment Script for Vonix Network (Windows)
REM Usage: scripts\deploy-production.bat

setlocal EnableDelayedExpansion

set PROJECT_NAME=vonix-network
set BACKUP_DIR=.\backups
set LOG_DIR=.\logs

REM Create timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

set LOG_FILE=%LOG_DIR%\deployment-%timestamp%.log

echo [%date% %time%] Starting production deployment for %PROJECT_NAME%
echo [%date% %time%] Starting production deployment for %PROJECT_NAME% >> %LOG_FILE%

REM Create directories
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 1. Pre-deployment checks
echo [INFO] Running pre-deployment checks...
echo [%date% %time%] Running pre-deployment checks... >> %LOG_FILE%

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found. Please create it from .env.example
    echo [%date% %time%] ERROR: .env file not found >> %LOG_FILE%
    exit /b 1
)

REM Check JWT_SECRET
findstr /C:"your-super-secret-jwt-key-change-this" .env >nul
if !errorlevel! equ 0 (
    echo [ERROR] JWT_SECRET is still set to default value. Please change it!
    echo [%date% %time%] ERROR: JWT_SECRET is default value >> %LOG_FILE%
    exit /b 1
)

echo [SUCCESS] Pre-deployment checks passed
echo [%date% %time%] Pre-deployment checks passed >> %LOG_FILE%

REM 2. Backup current database
echo [INFO] Creating database backup...
echo [%date% %time%] Creating database backup... >> %LOG_FILE%

if exist ".\data\vonix.db" (
    copy ".\data\vonix.db" "%BACKUP_DIR%\pre-deploy-%timestamp%.db" >nul
    echo [SUCCESS] Database backed up to %BACKUP_DIR%\pre-deploy-%timestamp%.db
    echo [%date% %time%] Database backed up >> %LOG_FILE%
) else (
    echo [WARNING] No existing database found to backup
    echo [%date% %time%] No database to backup >> %LOG_FILE%
)

REM 3. Stop existing application
echo [INFO] Stopping existing application...
echo [%date% %time%] Stopping existing application... >> %LOG_FILE%

REM Try PM2 first
where pm2 >nul 2>nul
if !errorlevel! equ 0 (
    pm2 stop %PROJECT_NAME% 2>nul
    pm2 delete %PROJECT_NAME% 2>nul
    echo [SUCCESS] PM2 process stopped
    echo [%date% %time%] PM2 process stopped >> %LOG_FILE%
) else (
    echo [WARNING] PM2 not found
    echo [%date% %time%] PM2 not found >> %LOG_FILE%
)

REM 4. Install dependencies
echo [INFO] Installing backend dependencies...
echo [%date% %time%] Installing backend dependencies... >> %LOG_FILE%

call npm ci --only=production
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install backend dependencies
    echo [%date% %time%] ERROR: Backend dependencies failed >> %LOG_FILE%
    exit /b 1
)

echo [SUCCESS] Backend dependencies installed
echo [%date% %time%] Backend dependencies installed >> %LOG_FILE%

echo [INFO] Installing frontend dependencies...
echo [%date% %time%] Installing frontend dependencies... >> %LOG_FILE%

cd client
call npm ci --only=production
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    echo [%date% %time%] ERROR: Frontend dependencies failed >> %LOG_FILE%
    cd ..
    exit /b 1
)
cd ..

echo [SUCCESS] Frontend dependencies installed
echo [%date% %time%] Frontend dependencies installed >> %LOG_FILE%

REM 5. Run tests
echo [INFO] Running tests...
echo [%date% %time%] Running tests... >> %LOG_FILE%

call npm test
if !errorlevel! neq 0 (
    echo [ERROR] Tests failed - deployment aborted
    echo [%date% %time%] ERROR: Tests failed >> %LOG_FILE%
    exit /b 1
)

echo [SUCCESS] All tests passed
echo [%date% %time%] Tests passed >> %LOG_FILE%

REM 6. Build frontend
echo [INFO] Building frontend for production...
echo [%date% %time%] Building frontend... >> %LOG_FILE%

cd client
set GENERATE_SOURCEMAP=false
call npm run build
if !errorlevel! neq 0 (
    echo [ERROR] Frontend build failed
    echo [%date% %time%] ERROR: Frontend build failed >> %LOG_FILE%
    cd ..
    exit /b 1
)
cd ..

echo [SUCCESS] Frontend built successfully
echo [%date% %time%] Frontend built >> %LOG_FILE%

REM 7. Start application
echo [INFO] Starting application...
echo [%date% %time%] Starting application... >> %LOG_FILE%

where pm2 >nul 2>nul
if !errorlevel! equ 0 (
    REM Start with PM2
    call pm2 start ecosystem.config.js --env production
    call pm2 save
    echo [SUCCESS] Application started with PM2
    echo [%date% %time%] Application started with PM2 >> %LOG_FILE%
    
    REM Wait for startup
    timeout /t 5 /nobreak >nul
    
    REM Check if running
    pm2 list | findstr /C:"online" >nul
    if !errorlevel! equ 0 (
        echo [SUCCESS] Application is running
        echo [%date% %time%] Application confirmed running >> %LOG_FILE%
    ) else (
        echo [ERROR] Application failed to start
        echo [%date% %time%] ERROR: Application failed to start >> %LOG_FILE%
        exit /b 1
    )
) else (
    REM Start manually
    set NODE_ENV=production
    start /B node server\index.js > %LOG_DIR%\app.log 2>&1
    echo [SUCCESS] Application started manually
    echo [%date% %time%] Application started manually >> %LOG_FILE%
)

REM 8. Health check
echo [INFO] Running health check...
echo [%date% %time%] Running health check... >> %LOG_FILE%

timeout /t 5 /nobreak >nul

REM Try to ping health endpoint (requires curl or similar)
where curl >nul 2>nul
if !errorlevel! equ 0 (
    curl -f -s "http://localhost:5000/api/health" >nul
    if !errorlevel! equ 0 (
        echo [SUCCESS] Health check passed
        echo [%date% %time%] Health check passed >> %LOG_FILE%
    ) else (
        echo [WARNING] Health check failed - please verify manually
        echo [%date% %time%] Health check failed >> %LOG_FILE%
    )
) else (
    echo [WARNING] curl not found - please verify health manually at http://localhost:5000/api/health
    echo [%date% %time%] curl not found for health check >> %LOG_FILE%
)

REM 9. Final status
echo.
echo ================================
echo   DEPLOYMENT COMPLETED
echo ================================
echo.
echo Application URLs:
echo   Frontend: http://localhost:5000
echo   API Docs: http://localhost:5000/api-docs
echo   Health:   http://localhost:5000/api/health
echo.
echo Useful Commands:
where pm2 >nul 2>nul
if !errorlevel! equ 0 (
    echo   Monitor: pm2 monit
    echo   Logs:    pm2 logs %PROJECT_NAME%
    echo   Restart: pm2 restart %PROJECT_NAME%
) else (
    echo   Logs:    type %LOG_DIR%\app.log
    echo   Manual restart required
)
echo.
echo Deployment completed at %date% %time%
echo Log file: %LOG_FILE%

echo [%date% %time%] Deployment completed successfully >> %LOG_FILE%

endlocal
exit /b 0
