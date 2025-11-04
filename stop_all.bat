@echo off
echo 正在停止羽毛球比赛工具服务...
echo ====================================

:: 设置编码为UTF-8
chcp 65001 > nul

:: 停止Node进程
echo 停止前端开发服务...
taskkill /f /im node.exe /t 2>nul
if %errorlevel% equ 0 (
    echo 前端开发服务已停止
) else (
    echo 未检测到运行中的前端服务
)

:: 清理临时文件
if exist temp (
    rmdir /s /q temp 2>nul
    echo 临时文件已清理
)

echo ====================================
echo 所有服务已成功停止！
echo ====================================
echo 按任意键关闭此窗口...
pause > nul 
