# 羽毛球比赛管理工具

一个用于管理羽毛球团体赛的轻量级工具，提供比赛安排、队伍管理、比分记录等功能。

## 功能特点

- 🏆 比赛编排：自动生成合理的比赛时间表和场地分配
- 👥 队伍管理：方便管理多个队伍及其队员信息
- 📊 比分记录：实时记录和更新比赛结果
- 📱 响应式设计：适配不同尺寸的设备显示
- 💾 本地存储：无需服务器即可使用全部功能
- 📤 数据迁移：支持数据导出导入，方便在不同设备间共享数据

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design (UI组件库)
- React Router (路由管理)
- 本地存储 (localStorage)

### 后端 (轻量级)
- Flask (Python)
- 提供基础API支持，主要业务逻辑在前端实现

## 快速开始

1. 克隆项目仓库
```bash
git clone https://github.com/yourusername/badminton_tournament_tool.git
cd badminton_tournament_tool
```

2. 使用快速启动脚本
```bash
# Windows
start_quick.bat

# Linux/Mac
./start_quick.sh
```

3. 打开浏览器访问
```
http://localhost:3000
```

## 安装与开发

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py
```

## 文档

详细文档请查看 `docs` 目录：
- [用户指南](docs/user_guide.md)
- [开发指南](docs/development_guide.md)
- [API文档](docs/api_docs.md)
- [贡献指南](docs/contributing.md)
- [更新日志](docs/changelog.md)
- [数据导入导出指南](docs/数据导入导出指南.md)

## 许可证

MIT 