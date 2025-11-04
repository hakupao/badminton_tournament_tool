# 羽毛球比赛管理工具项目教程

本文档面向希望快速了解与二次开发本工具的同学，涵盖整体架构、核心代码位置、数据流以及常见开发流程。2025 年 11 月起，项目已经完全转向 **纯前端架构**，所有业务逻辑与数据持久化都运行在浏览器端，只有当你需要扩展云端能力时才会接入 Vercel Serverless Functions。

## 1. 架构与技术栈

| 层级 | 说明 |
| --- | --- |
| 前端 | React 18 + TypeScript + Ant Design + Vite |
| 状态 | React Context (`src/store.tsx`) + `localStorage` 持久化 |
| 数据处理 | `src/data-utils.ts` / `src/utils.ts` 负责赛程生成、导入导出 |
| 可选云函数 | `api/health.js`（Node.js 22）示例，可按需扩展 |

项目默认 **不依赖任何本地/远程后端服务**。这意味着：

- 安装 Node.js 与 npm 即可本地开发；
- 所有比赛配置、队伍、比分等数据保存在浏览器 `localStorage`；
- 若需要和外部系统同步，可在 `api/` 目录增加 Serverless Function，再在前端调用 `/api/*` 路径。

## 2. 目录速览

```
badminton_tournament_tool/
├── api/                 # 可选的 Vercel Serverless Functions（默认只有 /api/health）
├── docs/                # 用户手册、开发指南、数据导出导入说明等
├── frontend/            # Vite + React 应用
│   ├── src/
│   │   ├── components/  # 可复用 UI 组件
│   │   ├── pages/       # 页面级组件（统筹、队伍管理、数据管理等）
│   │   ├── types/       # 结构化类型声明
│   │   ├── App.tsx      # 路由与页面骨架
│   │   ├── data-utils.ts# 赛程生成、Excel/JSON 导入导出
│   │   ├── store.tsx    # Context + localStorage 状态管理
│   │   └── utils.ts     # 共用工具函数
├── start_browser.bat    # Windows 一键启动脚本（仅启动前端）
├── start_all.sh         # macOS/Linux 示例脚本
└── stop_all.bat         # Windows 停止脚本（结束 node 进程）
```

## 3. 核心模块说明

| 模块 | 文件 | 说明 |
| --- | --- | --- |
| 全局状态 | `src/store.tsx` | 使用 React Context 保存 `matches`、`timeSlots`，任何更新自动同步到 `localStorage` |
| 比赛统筹 | `src/pages/TournamentSetup.tsx` 等 | 设置队伍数量、场地、时间段等基础参数 |
| 队伍/阵容管理 | `src/pages/TeamManagement.tsx`、`src/pages/FormationManagement.tsx` | 录入队伍与出场阵容 |
| 赛程与比分 | `src/pages/ScheduleGeneration.tsx`、`src/pages/MatchList.tsx` | 自动排赛、记录比分、切换列表/矩阵视图 |
| 数据迁移 | `src/pages/DataManagement.tsx` | 通过 `data-utils.ts` 导入/导出 JSON |
| 工具函数 | `src/data-utils.ts` | 处理表格导出、Excel 解析、随机比分生成等 |

## 4. 数据流与存储策略

1. 页面操作通过 Context 修改内存状态；
2. `store.tsx` 在 `setMatches` / `setTimeSlots` 中同步写入 `localStorage`；
3. 页面刷新时，通过 `getInitialMatches` / `getInitialTimeSlots` 重新加载持久化数据；
4. 导入导出功能直接读写 JSON/Excel 文件，不依赖服务器；
5. 如需云端同步，在 `api/` 下新增函数，并在前端通过 `fetch('/api/xxx')` 与之通信。

## 5. 开发与运行

### 5.1 快速启动

- **Windows**：双击 `start_browser.bat`，脚本会执行 `npm install`、`npm run dev` 并在浏览器打开 `http://localhost:3000`。
- **macOS/Linux**：执行 `./start_all.sh`（或手动 `cd frontend && npm install && npm run dev`）。

### 5.2 常用命令

```bash
cd frontend
npm install          # 安装依赖
npm run dev          # 启动本地开发
npm run build        # 生成生产构建（frontend/dist）
npm run preview      # 预览构建结果
```

### 5.3 停止服务

在 Windows 上可运行 `stop_all.bat`，其会尝试结束 `node.exe` 进程并清理由 `start_browser.bat` 产生的临时文件。

## 6. 扩展 Serverless Function（可选）

1. 在 `api/` 目录创建 `foo.js`：
   ```js
   export default function handler(req, res) {
     res.status(200).json({ status: 'ok', message: 'Hello from foo' })
   }
   ```
2. 本地调试时使用 `vercel dev`；部署时 `vercel deploy` 即可托管静态站点 + Functions。
3. 前端通过 `fetch('/api/foo')` 调用即可，无需配置 Vite 代理。

## 7. 调试与排障建议

- **数据清理**：如遇错误数据，可在“数据管理 → 数据清理”中清空 `localStorage`，或在浏览器开发者工具中手动删除相关键值。
- **依赖问题**：若脚本启动失败，可删除 `frontend/node_modules` 再次执行 `npm install`。
- **端口占用**：开发服务器默认使用 3000 端口，可在 `frontend/vite.config.ts` 中调整。
- **构建体积提示**：Vite 在 `npm run build` 时可能提示 chunk 过大，可根据需要拆分页面或引入懒加载。

## 8. 资源与文档

- `README.md`：项目概述、部署方式
- `docs/user_guide.md`：面向普通管理员的使用手册
- `docs/development_guide.md`：开发环境、代码规范与可选 Serverless 扩展
- `docs/数据导入导出指南.md`：数据迁移步骤
- `docs/changelog.md`：版本变更
- `docs/contributing.md`：贡献与提交流程

欢迎在 GitHub Issues 提交问题或改进建议，共同打造更好用的羽毛球比赛管理工具。 
