@echo off
chcp 936 >nul
title 正在同步 RUI Studio 到 GitHub 云端...
echo ========================================================
echo  RUI Studio 一键云端同步与备份
echo ========================================================
echo.
cd /d "D:\Xiao的个人站"
echo 1. 正在检查本地修改...
git status -s
echo.
echo 2. 正在打包提交本地更新...
git add .
git commit -m "update resources and site content"
echo.
echo 3. 正在推送到 GitHub (main 分支)...
git push origin main
echo.
echo ========================================================
echo  同步完成！GitHub 仓库已更新至最新。
echo ========================================================
timeout /t 5
