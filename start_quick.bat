@echo off
chcp 65001 >nul
echo ====================================
echo  羽毛球比赛工具 - 快速启动脚本
echo ====================================
echo.

echo 🚀 启动后端服务...
start "后端服务 - Flask" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"

echo 等待后端服务启动...
timeout /t 2 /nobreak >nul

echo 🚀 启动前端服务...
start "前端服务 - React" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 服务启动完成！
echo.
echo 📌 访问地址：
echo    前端界面: http://localhost:3000
echo    后端API:  http://localhost:5000
echo.
echo 💡 关闭对应窗口即可停止服务
echo.
pause 