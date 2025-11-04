#!/bin/bash

# 进入脚本所在目录
cd "$(dirname "$0")"

# 启动后端
echo "启动后端..."
cd backend
source venv/bin/activate
python app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 启动前端
echo "启动前端..."
cd frontend
npm install
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待前端端口3000可用
echo "等待前端服务启动..."
while ! nc -z localhost 3000; do
  sleep 1
done

# 打开浏览器
open http://localhost:3000

echo "前后端已启动，日志分别保存在 backend.log 和 frontend.log"
echo "如需停止服务，可运行：kill $BACKEND_PID $FRONTEND_PID"