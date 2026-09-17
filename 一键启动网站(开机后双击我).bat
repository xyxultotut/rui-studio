@echo off
chcp 65001 >nul
title RUI的个人站 - 本地服务启动器
cd /d "%~dp0"
echo ========================================================
echo           RUI 的个人站 - 本地服务启动器
echo ========================================================
echo.

netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 本地服务已经在运行中！
    echo 正在自动为您打开浏览器...
    start "" "http://localhost:3000/"
    exit /b
)

echo [提示] 正在启动 Vite 极速本地服务器...
start /min "" cmd /c "npm run dev"
echo 等待服务初始化...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/"
echo.
echo ========================================================
echo  已在默认浏览器打开: http://localhost:3000/
echo  本启动窗口将在 3 秒后自动关闭，后台服务持续保持运行。
echo ========================================================
timeout /t 3 /nobreak >nul
