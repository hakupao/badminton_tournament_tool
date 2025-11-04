# 羽毛球赛事管理系统 - 开发指南

## 目录

- [开发环境配置](#开发环境配置)
- [项目架构](#项目架构)
- [前端开发](#前端开发)
- [可选 Serverless 扩展](#可选-serverless-扩展)
- [数据管理](#数据管理)
- [数据流](#数据流)
- [代码规范](#代码规范)
- [测试](#测试)
- [部署](#部署)

## 开发环境配置

### 必要软件

- **Node.js**: v16.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **Git**: 版本控制
- **VSCode** (推荐): 代码编辑器
- （可选）**Python 3.8+**：仅在需要运行 `generate_scores.py` 等脚本时使用

### 环境设置

1. **克隆代码库**:
   ```bash
   git clone <repository-url>
   cd badminton_tournament_tool
   ```

2. **前端设置**:
   ```bash
   cd frontend
   npm install
   ```

3. **（可选）Serverless 函数设置**:
   - 如需扩展 API，可在 `api/` 目录新增 Vercel Function，并按照 Vercel 文档启动 `vercel dev`

## 项目架构

### 整体架构

本项目采用“纯前端 + 可选 Serverless”的架构：

- **前端**: React + TypeScript 单页应用，所有业务逻辑与数据持久化均运行在浏览器（`localStorage`）
- **Serverless（可选）**: Vercel Node.js Functions（目前仅示例 `/api/health`），按需扩展
- **通信**: 默认无需 HTTP 通信；如扩展 Function，可通过 `fetch/axios` 与 `/api/*` 交互

### 目录结构

```
badminton_tournament_tool/
├── frontend/           # 前端React应用
│   ├── src/            # 源代码
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 可复用组件
│   │   └── ...
│   └── ...
├── api/               # Vercel Serverless Functions（可选）
└── docs/              # 项目文档
```

## 前端开发

### 技术栈

- **React**: UI组件库
- **TypeScript**: 静态类型检查
- **Ant Design**: UI组件库
- **React Router**: 客户端路由
- **Vite**: 构建工具
- **localStorage**: 本地数据存储

### 开发工作流

1. **启动开发服务器**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **构建生产版本**:
   ```bash
   npm run build
   ```

### 组件开发

- 所有新组件应放在`src/components/`目录下
- 页面级组件应放在`src/pages/`目录下
- 组件应采用函数式组件和React Hooks
- 使用TypeScript类型定义确保类型安全

### 视图模式

- **列表视图**: 以表格形式展示数据，适用于大量数据的分页展示
- **矩阵视图**: 以矩阵形式展示数据，按时间段和场地组织比赛信息
  - 实现在 `src/pages/MatchList.tsx` 中
  - 使用Flex布局确保同一时间段的比赛在同一行显示
  - 支持响应式设计，在不同屏幕尺寸下自适应

### 状态管理

- 使用React Context API进行全局状态管理
- 主要状态管理逻辑在`src/store.tsx`中
- 避免不必要的状态提升，尽量保持状态在需要的组件中
- 利用localStorage持久化关键数据

## 可选 Serverless 扩展

### 适用场景

- 与外部系统同步（如共享比分、推送Webhook）
- 提供健康检查或系统版本信息
- 访问需要保护的机密（如第三方 API 密钥）

### 推荐方式

1. 在 `api/` 目录创建新的 Function 文件，例如 `api/sync.js`。
2. 导出 `handler(req, res)` 并返回 JSON。
3. 使用 `vercel dev` 进行本地调试，或直接 `vercel deploy`。

### 开发建议

- 轻量逻辑放在 Serverless，复杂数据仍在前端存储
- 明确区分 GET/POST 等 HTTP 动词
- 使用环境变量存储敏感配置
- 更新 `docs/api` 相关文档，保持接口契约清晰

## 数据管理

### 本地存储

本项目当前主要使用浏览器的localStorage进行数据存储:

1. **存储键设计**:
   - `tournamentConfig`: 比赛统筹配置
   - `tournamentTeams`: 队伍信息
   - `tournamentPlayers`: 队员信息
   - `tournamentSchedule`: 赛程安排
   - `tournamentMatches`: 比赛详情记录

2. **数据持久化**:
   ```javascript
   // 保存数据
   const saveData = (key, data) => {
     localStorage.setItem(key, JSON.stringify(data));
   };
   
   // 读取数据
   const loadData = (key) => {
     const data = localStorage.getItem(key);
     return data ? JSON.parse(data) : null;
   };
   ```

3. **数据同步**:
   - 更新UI状态的同时更新localStorage
   - 页面加载时从localStorage初始化状态
   - 使用React Context在组件间共享状态

### 主要数据结构

1. **比赛(Match)**:
   ```typescript
   interface Match {
     id: string;
     round: number;
     timeSlot: number;
     court: number;
     matchType: string;
     teamA_Id: string;
     teamB_Id: string;
     teamA_Name: string;
     teamB_Name: string;
     teamA_Players: string[];
     teamB_Players: string[];
     teamA_PlayerNames: string[];
     teamB_PlayerNames: string[];
     status: 'pending' | 'ongoing' | 'finished';
     scores: Array<{set: number; teamAScore: number; teamBScore: number;}>;
     winner_TeamId?: string;
     createdAt: string;
   }
   ```

2. **队员(PlayerInfo)**:
   ```typescript
   interface PlayerInfo {
     code: string;      // 如 A1, B2
     name: string;
     teamCode: string;  // 如 A, B
     playerNumber: number; // 如 1, 2
   }
   ```

3. **比赛配置(TournamentConfig)**:
   ```typescript
   interface TournamentConfig {
     teamCount: number;      // 参赛队伍数量
     teamCapacity: number;   // 每队人数
     formations: string[];   // 阵型配置（如['1+2', '3+5']）
     courtCount: number;     // 场地数量
     matchDuration: number;  // 比赛时长（分钟）
   }
   ```

### 未来数据管理计划

随着项目发展，可能考虑以下数据管理升级:

1. **云端数据库**: 替换localStorage为云端数据库存储
   - SQLite/MySQL: 关系型数据库存储结构化数据
   - MongoDB: 适用于更灵活的数据结构

2. **云端同步**: 支持多设备数据同步
   - 实现用户认证系统
   - 数据云端备份和恢复功能

3. **离线功能**: 支持离线使用和数据同步
   - 使用IndexedDB提供更强大的客户端存储
   - 实现离线工作和联网同步机制

## 数据流

1. **前端本地流程**:
   - 页面操作通过 Context 更新 React 状态
   - 同步写入 `localStorage`（键见“数据管理”章节）
   - 重新渲染 UI，保持单页面响应

2. **（可选）调用 Serverless**:
   - 若实现了 `/api/*`，通过 `fetch`/`axios` 调用
   - 收到响应后更新前端状态或提示用户

3. **数据导入导出**:
   - `data-utils.ts` 负责读取/写入 Excel、JSON
   - 通过下载/上传文件实现跨设备迁移

## 代码规范

### 通用规范

- 使用英文编写代码和注释
- 使用有意义的变量和函数名
- 遵循DRY原则(Don't Repeat Yourself)

### JavaScript/TypeScript规范

- 使用ES6+语法
- 优先使用const，其次let，避免var
- 使用箭头函数
- 使用async/await处理异步
- 组件名使用PascalCase，如TournamentSetup
- 非组件函数使用camelCase，如getPlayerData


## 测试

### 前端测试

- 使用Jest进行单元测试
- 使用React Testing Library进行组件测试
- 运行测试: `npm test`

### 可选 Serverless 测试

- 若实现 Node.js Function，可用 `vitest` / `jest` 编写单元测试
- 也可通过 `vercel dev` + `curl` 验证接口行为

## 部署

### 部署前准备

1. 前端构建生产版本:
   ```bash
   cd frontend
   npm run build
   ```

2. （可选）Serverless 函数:
   - 确保 `api/` 中的函数通过本地 `vercel dev` 验证
   - 将所需环境变量配置在 Vercel 项目中

### 部署选项

- **静态托管**: 上传 `frontend/dist` 到任意静态站点（Vercel、Netlify、GitHub Pages）
- **Vercel 一体化**: 直接 `vercel deploy`，自动构建前端并托管 `api/` Functions
