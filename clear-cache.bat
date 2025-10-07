@echo off
echo Clearing React cache and node_modules...
cd client
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q build 2>nul
echo Cache cleared!
echo.
echo Now restart the dev server with: npm run dev
pause
