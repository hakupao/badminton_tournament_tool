# Badminton Tournament Tool

一款面向羽毛球团体赛的管理应用，支持在线 Supabase 后端与离线浏览器缓存双模式运行。项目已经部署到 **Vercel**，并通过了最新的自测清单（见 `docs/supabase_testing_checklist.md`）。

## 功能概览

- 🗂 **比赛统筹**：配置队伍数量、场地、阵容组合，实时估算赛程长度。
- 👥 **队伍与阵容管理**：编辑球员姓名、批量生成/保存阵容，数据持久化到 Supabase。
- 🗓 **赛程生成**：依据阵容和场地自动排程（计划迁移至 Supabase，当前仍使用本地缓存）。
- 📊 **数据统计**：胜率、连场、净胜分等报表（同样待迁移至 Supabase）。
- 🔐 **邮箱 OTP 登录**：通过 Supabase Auth 获取一次性登录链接。
- 🌐 **双模式策略**：
  - **Online**：读写 Supabase 表，适合跨设备协作或部署环境。
  - **Offline fallback**：缺省或凭据失效时自动退回 `localStorage`，继续可用。

## 技术栈

| 层级 | 技术 |
| ---- | ---- |
| 前端 | React 18 · TypeScript · Vite · React Router · Ant Design |
| 状态与数据 | Context + 自定义 hooks · Supabase JS SDK · localStorage |
| 后端/托管 | Supabase（Auth / Postgres / RLS）· Vercel Frontend + Serverless |
| 工具 | Node.js ≥ 18（推荐 20/22）· npm · Supabase SQL Editor |

## 目录结构

```
badminton_tournament_tool/
├── frontend/                     # Vite + React 应用源码
│   ├── src/
│   │   ├── auth/                 # AuthProvider & hooks
│   │   ├── components/           # UI 组件（含 AuthGate 等）
│   │   ├── data/                 # 默认数据、导入逻辑
│   │   ├── hooks/                # useUserDataService 等自定义 hook
│   │   ├── pages/                # 页面模块（TournamentSetup、TeamManagement …）
│   │   ├── services/             # Supabase 数据服务 dataService.ts
│   │   ├── store.tsx             # 全局状态（融合 Supabase + 离线缓存）
│   │   └── types.ts              # 共享类型定义
│   └── ...                       # Vite 配置、依赖等
├── docs/                         # Runbook、待办、测试清单等文档
├── api/health.js                 # Vercel Serverless 健康检查（可扩展）
├── docs/supabase_schema.sql      # Supabase 数据库初始化脚本
└── README.md                     # 当前说明文档
```

## 快速开始

### 1. 准备 Supabase 项目与凭据

1. 登录 [Supabase](https://supabase.com/)，创建新项目并记录：
   - `Project URL`（例如 `https://xxxx.supabase.co`）
   - `anon public` API key
2. 在项目的 **Authentication → Providers** 中启用 Email OTP 或 Magic Link。
3. 打开 **SQL Editor**，执行仓库中的 `docs/supabase_schema.sql`，初始化所需表与 RLS 策略。

### 2. 配置本地环境

```bash
git clone <repo-url>
cd badminton_tournament_tool

# 初始化前端依赖
cd frontend
npm install
```

在 `frontend/.env.local` 中写入 Supabase 凭据（文件已在 `.gitignore` 中）：

```ini
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 <http://localhost:5173>：

- 若凭据有效：顶栏显示登录表单（在线模式）。在浏览器查看邮箱登录链接即可完成登录。
- 若凭据缺失/无效：页面显示 “离线模式”，仍可使用所有功能（数据保存在 `localStorage`）。

## 运行测试 / 自测流程

- 详细手动验证步骤已汇总在 `docs/supabase_testing_checklist.md`，覆盖 SDK 安装、Auth 流程、配置与阵容保存、默认数据导入等。
- 若进行 Supabase 在线测试，确保清理浏览器缓存或 Supabase 表，以避免旧数据干扰。

## 部署到 Vercel

1. 在 Vercel 控制台或 CLI (`vercel link`) 关联仓库。
2. 在 **Project Settings → Environment Variables** 中增加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 推送代码或执行：
   ```bash
   vercel deploy            # 预览环境
   vercel deploy --prod     # 生产环境
   ```
4. 部署完成后访问 `https://<your-project>.vercel.app` 验证登录、数据编辑流程。

> 若仅保留前端，可删除 / 不上传 `api/health.js`；如需扩展后端能力，可继续在 `api/` 目录添加 Serverless Functions。

## 常见问题

- **登录邮件收不到**：在 Supabase Auth 设置中确认已配置 SMTP（免费版默认使用 Supabase 邮件服务，但有速率限制）。
- **仍显示离线模式**：检查 `.env.local` 是否生效，重新运行 `npm run dev`，或在 Vercel 确认环境变量拼写无误。
- **RLS 拒绝访问**：确保登录用户信息已写入 `user_id` 字段，并执行了 `docs/supabase_schema.sql` 中的策略。
- **离线数据不更新**：清空浏览器 `localStorage` 或使用 DevTools Application 面板手动删除旧条目。

## 文档索引

- `docs/supabase_integration_runbook.md`：分步骤的集成进度及待办状态。
- `docs/supabase_integration_todo.md`：任务清单（勾选项表示已落地）。
- `docs/supabase_testing_checklist.md`：执行过的手动测试步骤与期望。
- `docs/` 目录下其他指南：开发流程、导入导出、教程等。

## 许可证

MIT License © Badminton Tournament Tool contributors
