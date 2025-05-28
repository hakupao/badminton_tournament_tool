@echo off
chcp 65001 >nul
echo ====================================
echo    羽毛球比赛工具 - 一键启动脚本
echo ====================================
echo.

echo [1/4] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境检查通过

echo.
echo [2/4] 检查Python环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Python，请先安装Python
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python环境检查通过

echo.
echo [3/4] 安装/更新依赖...
echo 正在安装前端依赖...
cd frontend
if not exist "node_modules" (
    echo 首次运行，正在安装前端依赖（这可能需要几分钟）...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo 前端依赖已存在，跳过安装
)

echo 正在安装后端依赖...
cd ..\backend
if not exist "venv" (
    echo 创建Python虚拟环境...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ❌ 虚拟环境创建失败
        pause
        exit /b 1
    )
)

echo 激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

echo.
echo [4/4] 启动服务...
cd ..

echo 🚀 正在启动后端服务（Flask）...
start "后端服务 - Flask" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo 🚀 正在启动前端服务（React）...
start "前端服务 - React" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo ✅ 服务启动完成！
echo.
echo 📌 访问地址：
echo    前端界面: http://localhost:3000
echo    后端API:  http://localhost:5000
echo.
echo 💡 提示：
echo    - 两个服务窗口将自动打开
echo    - 关闭窗口即可停止对应服务
echo    - 如需重启，请关闭所有窗口后重新运行此脚本
echo ========================================
echo.
echo 按任意键退出启动脚本...
pause >nul 