# Badminton Tournament Tool

> 一个面向羽毛球团体赛组织者的赛事管理工具，聚焦赛前编排、赛中录分、赛后统计，以及“在线协作 + 离线可用”的实际落地体验。

<p>
  <a href="https://github.com/hakupao/badminton_tournament_tool"><img alt="Repo" src="https://img.shields.io/badge/GitHub-hakupao%2Fbadminton__tournament__tool-181717?logo=github"></a>
  <img alt="Status" src="https://img.shields.io/badge/status-personal%20tool-0f766e">
  <img alt="Demo" src="https://img.shields.io/badge/demo-pending%20redeploy-9ca3af">
  <img alt="React" src="https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white">
  <img alt="Ant Design" src="https://img.shields.io/badge/Ant%20Design-5-1677FF?logo=antdesign&logoColor=white">
  <img alt="Fastify" src="https://img.shields.io/badge/Fastify-4-000000?logo=fastify&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-supported-3ECF8E?logo=supabase&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white">
</p>

## 项目预览

<p>
  <img src="./docs/readme/tournament-setup.png" width="49%" alt="比赛统筹页面预览">
  <img src="./docs/readme/match-matrix.png" width="49%" alt="比赛矩阵页面预览">
</p>

## 这是什么

这不是一个泛化的“赛事平台”，而是一个围绕羽毛球团体赛真实组织流程打磨出来的实用工具：

- 赛前：配置队伍规模、场地数量、出场阵容和预计赛程时长。
- 赛中：按时间段和场地查看比赛矩阵、录入比分、临时调整上场队员。
- 赛后：查看团体排名、选手胜率、组合胜率、连续出场与空档统计，并导出 Excel。

如果把它当作一个个人技术作品来看，它的价值不只是 UI 本身，而是这几个工程取舍：

- 用一套前端业务流程同时支撑 `Supabase`、本地 `Fastify + PostgreSQL` 和纯浏览器离线缓存。
- 在无法连接远端数据源时自动回退到 `localStorage`，保证工具“先能用，再逐步在线化”。
- 用默认样例数据做首屏引导，首次运行不需要手工造数据就能理解完整流程。

## 设计内核

这个项目解决的核心问题不是“怎么做一个漂亮表单”，而是“怎么把团体赛编排这件反复发生、容易混乱、经常靠 Excel 和临时沟通解决的事情产品化”。

具体做法是：

- 把比赛组织过程拆成稳定的六个页面：比赛统筹、队伍管理、阵容配置、赛程生成、比赛管理、数据管理。
- 用服务层把数据读写抽象出来，让同一套页面逻辑能跑在不同数据源之上。
- 在赛程生成里加入偏实战的调度约束，例如尽量避免连续作战过多、兼顾休息时间和场地分配。
- 把“打印 / 导出 / 现场执行”作为一等场景考虑进去，而不是只停留在后台录入。

## 适用场景

- 学校、社团、公司内部的羽毛球团体赛组织。
- 需要快速拉起一套本地可跑、可导出的赛事管理网页。
- 想参考一个“前端业务流 + 多数据后端 + 离线兜底”的个人工程样例。
- 想把一类现实中的手工流程，逐步沉淀成可部署的 Web 工具。

## 核心能力

- `比赛统筹`：配置队伍数量、队伍容量、场地数、单场耗时和阵容组合，并实时估算总时长。
- `队伍管理`：按队伍批量维护球员名册，支持快速初始化和人数调整。
- `阵容配置`：为每支队伍配置各个比赛项目的上场组合，也支持一键生成默认阵容。
- `赛程生成`：自动生成按时间段与场地分配的赛程，尽量平衡连续出场与休息空档。
- `比赛管理`：提供矩阵视图和列表视图，可录比分、调队员、导出 Excel。
- `数据管理`：生成团体排名、选手胜率、组合胜率、连续参赛与空档统计。
- `默认演示数据`：首开自动导入样例赛事，方便直接体验完整流程。
- `离线兜底`：远端不可用时自动回退浏览器缓存，不阻断使用。

## 运行模式

| 模式 | 数据源 | 登录方式 | 适用场景 |
| --- | --- | --- | --- |
| 离线模式 | `localStorage` | 无需登录 | 本地试用、快速演示、无后端环境 |
| Supabase 模式 | Supabase Auth + Postgres + RLS | 邮箱 OTP / Magic Link | 多设备协作、云端部署 |
| 本地服务模式 | Fastify + PostgreSQL + Drizzle | 本地管理员密码 | NAS、自托管、局域网部署 |

## 技术实现

### 前端

- `React 18`
- `TypeScript`
- `Vite`
- `React Router`
- `Ant Design`
- `XLSX`

### 数据与状态

- `Context + custom hooks`
- `service layer` 封装 `config / players / formations / matches / schedules / time slots`
- `localStorage` 作为离线缓存与回退层
- 默认数据播种：首次进入即可展示完整赛事样例

### 在线化路径

- `Supabase`：负责 Auth、Postgres 与 RLS 策略
- `Fastify + PostgreSQL + Drizzle`：提供本地自托管方案
- `Docker Compose`：可一键拉起数据库和本地服务端
- `Vercel`：可部署前端与简单 Serverless 接口

## 快速开始

### 1. 最快体验：纯前端离线模式

```bash
git clone https://github.com/hakupao/badminton_tournament_tool.git
cd badminton_tournament_tool/frontend
npm install
npm run dev
```

打开 `http://localhost:5173`。

如果没有配置 `Supabase` 环境变量，应用会自动进入离线模式，并使用默认样例数据完成首屏初始化。

### 2. Supabase 在线模式

1. 在 Supabase 创建项目。
2. 在 `Authentication -> Providers` 中启用 Email OTP / Magic Link。
3. 在 SQL Editor 中执行 [docs/supabase_schema.sql](./docs/supabase_schema.sql)。
4. 在 `frontend/.env.local` 写入：

```ini
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. 启动前端：

```bash
cd frontend
npm install
npm run dev
```

### 3. 本地自托管模式

适合 NAS、局域网或不想依赖第三方 BaaS 的场景。

```bash
start_local.bat
```

这会尝试启动：

- 本地后端：`server/` 下的 `Fastify + PostgreSQL` 方案
- 本地前端：通过 `VITE_USE_LOCAL_SERVER=true` 连接本地 API

前提：

- 你已经为 `server/` 准备好可用的 PostgreSQL 连接
- 已配置 `DATABASE_URL` 和本地管理员密码等环境变量

如果你想要更稳定的自托管启动方式，优先使用下面的 Docker 方案。

### 4. Docker 一键启动

```bash
docker compose up --build
```

默认会启动：

- `PostgreSQL 15`
- `Fastify` 服务端
- 内置前端静态资源

默认端口：

- Web: `http://localhost:3000`
- DB: `postgres://postgres:postgres@localhost:5432/badminton`

## 部署说明

### Vercel

仓库已具备 `vercel.json`，前端可直接部署到 Vercel。

需要配置的环境变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

说明：

- 仓库元数据中登记过 Vercel 主页，但当前公开域名已失效。
- 因此本 README 不放置失效的在线体验链接，建议重新部署后再补充。

### Docker / 自托管

如果你更看重可控性，而不是云端协作，优先使用 `docker-compose.yml`：

- 数据放在你自己的 PostgreSQL 中
- 登录由本地服务端密码控制
- 前端静态资源由本地服务端直接托管

## 目录结构

```text
badminton_tournament_tool/
├── frontend/                 # React + Vite 前端
│   └── src/
│       ├── auth/             # 登录态与模式切换
│       ├── components/       # AuthGate、数据迁移等组件
│       ├── data/             # 默认演示数据与播种逻辑
│       ├── hooks/            # useUserDataService 等
│       ├── pages/            # 六个核心业务页面
│       ├── services/         # 数据服务、REST/Supabase 封装
│       ├── utils/            # 辅助方法
│       └── types.ts          # 共享类型
├── server/                   # Fastify + Drizzle + PostgreSQL 服务端
├── api/                      # Vercel Serverless 入口
├── docs/
│   ├── supabase_schema.sql   # Supabase 表结构与 RLS
│   ├── supabase_testing_checklist.md
│   └── readme/               # README 使用的页面预览图
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 当前边界与后续可做项

这个仓库已经适合作为一个可展示、可继续迭代的个人工程，但有几处边界值得明确说明：

- 部分页面的数据流已经抽象到服务层，另一些逻辑仍直接访问 `localStorage`，还在继续收敛。
- 公开 demo 域名目前失效，需要重新部署后再补线上入口。
- 仓库当前没有单独的 `LICENSE` 文件；如果打算长期公开维护，建议补充许可协议。
- 目前以手动验证为主，自动化测试仍有补齐空间。

## 文档

- [docs/supabase_schema.sql](./docs/supabase_schema.sql): Supabase 数据库结构与 RLS 策略
- [docs/supabase_testing_checklist.md](./docs/supabase_testing_checklist.md): 手动测试清单

## 仓库定位

这是一个很典型的“从真实需求长出来”的个人技术作品：

- 题目足够具体，不是空泛的管理后台模板。
- 功能闭环完整，从编排到录分再到统计和导出。
- 工程实现上有明确主题：多数据源、离线回退、自托管和云部署共存。

如果你正在做类似的实用型 Web 工具，这个项目最值得参考的不是某一个页面，而是它把“先解决问题，再逐步工程化”这件事落到了代码结构里。
