# 羽毛球赛事管理系统

## 项目概述

羽毛球赛事管理系统是一个全面的比赛管理工具，帮助组织者高效管理羽毛球比赛的各个方面，包括队伍管理、阵容配置、赛程安排、比赛记录和数据分析等功能。

## 主要功能

- **比赛统筹**：整体赛事配置和管理
- **队伍管理**：管理参赛队伍和选手信息
- **阵容配置**：安排比赛阵容和选手搭配
- **赛程生成**：自动或手动生成比赛日程
- **比赛管理**：记录比赛结果和比分
  - **矩阵视图**：按时间段和场地展示比赛，同一时间段的比赛在同一行显示
  - **列表视图**：传统列表方式查看所有比赛
- **数据管理**：分析比赛数据，生成统计报表

## 技术栈

### 前端
- React (React 18)
- TypeScript
- Ant Design 组件库
- React Router
- Vite 构建工具

### 后端
- Python
- Flask Web 框架
- Flask-CORS 处理跨域请求

## 快速开始

### 环境要求
- Node.js (推荐 v16+)
- Python (推荐 v3.8+)
- MongoDB

### 安装与启动

使用提供的批处理文件快速启动应用：

1. **首次使用**：运行 `start.bat`（完整安装并启动）
2. **日常使用**：运行 `start_quick.bat`（快速启动已配置环境）
3. **停止服务**：运行 `stop.bat`

### 访问地址
- 前端界面: http://localhost:3000
- 后端 API: http://localhost:5000

## 项目结构

```
badminton_tournament_tool/
├── frontend/           # 前端 React 应用
├── backend/            # 后端 Flask 应用
├── docs/               # 项目文档
├── start.bat           # 完整启动脚本
├── start_quick.bat     # 快速启动脚本
├── stop.bat            # 停止服务脚本
└── 启动说明.md         # 详细启动指南
```

## 文档
详细文档请参考 [docs/](./docs/) 目录：
- [用户手册](./docs/user_guide.md)
- [开发指南](./docs/development_guide.md)
- [API文档](./docs/api_docs.md)

## 贡献
欢迎提交问题报告和改进建议！ 