@echo off
chcp 65001 >nul
echo ====================================
echo  羽毛球比赛工具 - 停止服务脚本
echo ====================================
echo.

echo 🛑 正在停止所有相关服务...

echo 停止Node.js进程（前端）...
taskkill /f /im node.exe >nul 2>&1

echo 停止Python进程（后端）...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" /fo table /nh ^| find "python.exe"') do (
    taskkill /f /pid %%i >nul 2>&1
)

echo 关闭相关命令窗口...
taskkill /f /fi "WindowTitle eq 后端服务 - Flask*" >nul 2>&1
taskkill /f /fi "WindowTitle eq 前端服务 - React*" >nul 2>&1

echo.
echo ✅ 所有服务已停止！
echo.
pause 