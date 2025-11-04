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

## 项目结构一览

```
badminton_tournament_tool
├── frontend/        # Vite + React 前端应用，包含所有业务页面与状态管理
├── backend/         # 轻量级 Flask 服务，便于本地调试和未来扩展 API
├── api/             # Vercel Serverless Functions（当前提供 /api/health，Node/Edge 处理）
├── docs/            # 用户与开发文档
├── vercel.json      # Vercel 部署配置（静态站点 + Serverless）
└── .vercelignore    # 避免上传虚拟环境、临时数据等大文件
```

### 数据流说明
- **端到端**：页面通过 `src/store.tsx` 与 `localStorage` 持久化比赛、时间段等核心数据。
- **API 调用**：`src/api.ts` 统一请求 `/api/*`；生产环境由 Vercel Serverless 提供健康检查等轻量接口，本地开发则由 Flask 服务响应。
- **工具函数**：`src/data-utils.ts`、`src/utils.ts` 集中处理赛程生成、Excel 导入导出及比分计算逻辑。

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

## 部署到 Vercel

项目已经包含 `vercel.json`，可以无缝构建前端并使用 Node Serverless Functions 暴露 `/api/health` 健康检查。

1. 安装并登录 Vercel CLI
   ```bash
   npm install -g vercel
   vercel login
   ```
2. 在仓库根目录执行一次构建并链接项目
   ```bash
   vercel link   # 选择或创建 Vercel 项目
   vercel build  # 可选：本地验证生产构建
   ```
3. 部署（pull request 环境或生产）：
   ```bash
   vercel deploy            # 生成临时预览环境
   vercel deploy --prod     # 推送到生产
   ```

Vercel 将执行以下动作：
- `npm install --prefix frontend && npm run build --prefix frontend` 生成 `frontend/dist` 静态资源。
- `api/health.ts` 基于 Node.js 22 Serverless Function 运行，提供 `/api/health`。
- `rewrites` 规则会把除 `/api/*` 和静态资源外的请求重写到 `index.html`，确保 React Router 的多页面路由可以直接刷新访问。

> 如需扩展更多后端能力，可继续在 `backend/` 中迭代 Flask 服务用于本地调试，并在 `api/` 目录新增相应的 Serverless Functions 以匹配 `/api/*` 路由。建议本地 Node.js 版本保持在 20 或 22，以与 Vercel 执行环境保持一致。

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
