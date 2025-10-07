@echo off
echo ================================================
echo Vonix.Network Community - Installation Script
echo ================================================
echo.

echo [1/4] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install backend dependencies!
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo [2/4] Installing frontend dependencies...
cd client
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies!
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

echo [3/4] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created! Please edit it with your configuration.
) else (
    echo .env file already exists, skipping...
)
echo.

echo [4/4] Creating data directory...
if not exist data mkdir data
echo Data directory ready!
echo.

echo ================================================
echo Installation Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Edit .env file with your Discord bot token and other settings
echo 2. Run: npm run dev
echo.
echo Default admin credentials:
echo Username: admin
echo Password: admin
echo.
pause
