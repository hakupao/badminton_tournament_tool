# 羽毛球比赛管理工具 - 后端

羽毛球比赛管理工具的后端实现，基于Flask的轻量级API服务。

## 特点

- 使用Flask框架，提供简洁高效的REST API
- 轻量级设计，仅提供必要的API支持
- 易于部署和维护
- 支持跨域请求，方便前端开发

## 项目结构

```
backend/
├── app.py           # 应用入口
├── config.py        # 配置文件
├── requirements.txt # 依赖清单
└── venv/            # 虚拟环境（不包含在版本控制中）
```

## API接口

当前版本主要提供以下API：

- `GET /api/health` - 健康检查接口

注意：本项目采用"前端为主"的架构，大部分业务逻辑在前端实现，后端主要提供基础API支持。

## 开发环境配置

1. 创建并激活虚拟环境
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 启动开发服务器
```bash
python app.py
```

## 部署

可以使用多种方式部署：

1. 直接运行
```bash
python app.py
```

2. 使用Gunicorn（生产环境推荐）
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

3. 使用Docker（示例Dockerfile在项目根目录）
```bash
docker build -t badminton-backend .
docker run -p 5000:5000 badminton-backend
``` 