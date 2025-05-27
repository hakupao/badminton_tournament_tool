@echo off
chcp 65001 >nul
echo ====================================
echo    端口状态检查 - 诊断工具
echo ====================================
echo.

echo 🔍 检查端口占用情况...
echo.

echo [端口 3000 - 前端服务]
netstat -ano | findstr ":3000"
if %errorlevel% equ 0 (
    echo ✅ 端口 3000 正在被使用
) else (
    echo ❌ 端口 3000 未被占用（前端服务可能未启动）
)

echo.
echo [端口 5000 - 后端服务]
netstat -ano | findstr ":5000"
if %errorlevel% equ 0 (
    echo ✅ 端口 5000 正在被使用
) else (
    echo ❌ 端口 5000 未被占用（后端服务可能未启动）
)

echo.
echo 🔍 检查进程状态...
echo.

echo [Node.js 进程 - 前端]
tasklist | findstr "node.exe"
if %errorlevel% equ 0 (
    echo ✅ 发现 Node.js 进程
) else (
    echo ❌ 未发现 Node.js 进程
)

echo.
echo [Python 进程 - 后端]
tasklist | findstr "python.exe"
if %errorlevel% equ 0 (
    echo ✅ 发现 Python 进程
) else (
    echo ❌ 未发现 Python 进程
)

echo.
echo 🌐 测试网络连接...
echo.

echo [测试前端连接]
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://localhost:3000 2>nul
if %errorlevel% equ 0 (
    echo - 前端服务响应正常
) else (
    echo ❌ 前端服务无响应
)

echo.
echo [测试后端连接]
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://localhost:5000/api/health 2>nul
if %errorlevel% equ 0 (
    echo - 后端服务响应正常
) else (
    echo ❌ 后端服务无响应
)

echo.
echo ====================================
echo 💡 解决方案：
echo.
echo 如果端口未被占用或服务无响应：
echo 1. 运行 start.bat 启动服务
echo 2. 等待服务完全启动（通常需要10-30秒）
echo 3. 检查命令窗口是否有错误信息
echo.
echo 如果端口被其他程序占用：
echo 1. 运行 stop.bat 停止当前服务
echo 2. 关闭占用端口的其他程序
echo 3. 重新运行启动脚本
echo ====================================
echo.
pause 