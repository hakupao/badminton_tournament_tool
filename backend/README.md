# 羽毛球赛事管理系统 - 后端

## 项目概述

后端基于Python Flask框架开发，为羽毛球赛事管理系统提供API服务，处理数据存储、业务逻辑和数据分析功能。

## 技术栈

- **Python**: 编程语言
- **Flask**: Web框架
- **Flask-CORS**: 处理跨域请求
- **virtualenv**: Python虚拟环境

## 主要功能

- 数据存储和管理
- 赛事数据分析
- RESTful API接口
- 跨域资源共享(CORS)支持

## 项目结构

```
backend/
├── app.py                # 应用主入口，包含API路由定义
├── data_management.py    # 数据处理和分析功能
├── config.py             # 配置文件
├── requirements.txt      # 项目依赖
└── venv/                 # Python虚拟环境(由启动脚本创建)
```

## API接口

### 健康检查
- `GET /api/health` - 服务健康状态检查

### 数据分析接口
- `GET /api/data/consecutive-matches` - 获取在连续两个时间段都比赛的选手
- `GET /api/data/inactive-players` - 获取在连续三个时间段都没有参加比赛的选手
- `GET /api/data/group-rankings` - 获取循环赛中每个团体的实时排名
- `GET /api/data/player-win-rates` - 获取每个参加比赛的选手的胜率
- `GET /api/data/pair-win-rates` - 获取每个组合的胜率

### 数据更新接口
- `POST /api/matches` - 更新比赛数据

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
- 调试模式
- 其他配置项

## 数据处理

数据处理和分析功能集中在`data_management.py`模块中，包括：

- 选手连续比赛分析
- 不活跃选手检测
- 团体排名计算
- 选手胜率统计
- 配对组合胜率统计 