# 羽毛球赛事管理系统 - 后端

## 项目概述

后端基于Python Flask框架开发，为羽毛球赛事管理系统提供基础API服务。在本系统中，大部分数据处理功能都在前端实现，后端仅提供最基本的健康检查API。

## 技术栈

- **Python**: 编程语言
- **Flask**: Web框架
- **Flask-CORS**: 处理跨域请求
- **virtualenv**: Python虚拟环境

## 主要功能

- RESTful API接口(健康检查)
- 跨域资源共享(CORS)支持

## 项目结构

```
backend/
├── app.py                # 应用主入口，包含API路由定义
├── config.py             # 配置文件
├── requirements.txt      # 项目依赖
└── venv/                 # Python虚拟环境(由启动脚本创建)
```

## API接口

### 健康检查
- `GET /api/health` - 服务健康状态检查

## 开发指南

### 环境准备

确保已安装Python 3.8或更高版本。

### 创建虚拟环境

```bash
cd backend
python -m venv venv
```

### 激活虚拟环境

**Windows**:
```bash
venv\Scripts\activate
```

**Linux/macOS**:
```bash
source venv/bin/activate
```

### 安装依赖

```bash
pip install -r requirements.txt
```

### 启动开发服务器

```bash
python app.py
```

服务器默认在`http://localhost:5000`上运行。

## 配置

主要配置参数位于`config.py`文件中，包括：

- 服务器端口 