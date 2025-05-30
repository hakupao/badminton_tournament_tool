@echo off
echo 正在启动羽毛球比赛工具...
echo ====================================

:: 设置编码为UTF-8
chcp 65001 > nul

:: 创建临时目录用于存储进程ID
if not exist temp mkdir temp

:: 启动后端服务
echo 正在启动后端服务...
cd backend
start /min cmd /c "echo 后端服务窗口 & if not exist venv python -m venv venv & call venv\Scripts\activate & pip install -r requirements.txt & python app.py & echo 后端服务已启动 > ..\temp\backend_started.txt"
cd ..

:: 启动前端服务
echo 正在启动前端服务...
cd frontend
start /min cmd /c "echo 前端服务窗口 & npm install & npm run dev & echo 前端服务已启动 > ..\temp\frontend_started.txt"
cd ..

:: 等待服务启动
echo 等待服务启动...
:wait_loop
timeout /t 1 /nobreak > nul
if not exist temp\backend_started.txt goto wait_loop
if not exist temp\frontend_started.txt goto wait_loop

:: 删除临时文件
del /q temp\backend_started.txt 2>nul
del /q temp\frontend_started.txt 2>nul

:: 打开浏览器
echo 正在打开浏览器...
start http://localhost:3000

echo ====================================
echo 羽毛球比赛工具已成功启动！
echo 前端界面: http://localhost:3000
echo 后端API: http://localhost:5000
echo ====================================
echo 按任意键关闭此窗口...
pause > nul 