# 羽毛球赛事管理系统 - 开发指南

## 目录

- [开发环境配置](#开发环境配置)
- [项目架构](#项目架构)
- [前端开发](#前端开发)
- [后端开发](#后端开发)
- [数据管理](#数据管理)
- [数据流](#数据流)
- [代码规范](#代码规范)
- [测试](#测试)
- [部署](#部署)

## 开发环境配置

### 必要软件

- **Node.js**: v16.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **Python**: v3.8.0 或更高版本
- **pip**: 最新版本
- **Git**: 版本控制
- **VSCode** (推荐): 代码编辑器

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

3. **后端设置**:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/macOS
   pip install -r requirements.txt
   ```

## 项目架构

### 整体架构

本项目采用前后端分离的架构:

- **前端**: React + TypeScript 的单页应用
- **后端**: Python Flask RESTful API
- **通信**: 使用HTTP/JSON进行前后端通信

### 目录结构

```
badminton_tournament_tool/
├── frontend/           # 前端React应用
│   ├── src/            # 源代码
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 可复用组件
│   │   └── ...
│   └── ...
├── backend/            # 后端Flask应用
│   ├── app.py          # 主应用入口
│   ├── data_management.py # 数据处理逻辑
│   └── ...
└── docs/               # 项目文档
```

## 前端开发

### 技术栈

- **React**: UI组件库
- **TypeScript**: 静态类型检查
- **Ant Design**: UI组件库
- **React Router**: 客户端路由
- **Vite**: 构建工具
- **Axios**: HTTP客户端
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

## 后端开发

### 技术栈

- **Python**: 编程语言
- **Flask**: Web框架
- **Flask-CORS**: 处理跨域请求

### 架构说明

当前版本采用"前端为主"的架构:
- 后端仅提供基础API支持(如健康检查)
- 大部分业务逻辑在前端实现
- 数据存储在浏览器的localStorage中

### 开发工作流

1. **启动开发服务器**:
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/macOS
   python app.py
   ```

### API开发

- 所有新API路由应添加到`app.py`中
- 复杂的业务逻辑应拆分到单独的模块中
- 所有API应返回JSON格式的响应
- 确保API文档保持最新

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

1. **后端数据库**: 替换localStorage为后端数据库存储
   - SQLite/MySQL: 关系型数据库存储结构化数据
   - MongoDB: 适用于更灵活的数据结构

2. **云端同步**: 支持多设备数据同步
   - 实现用户认证系统
   - 数据云端备份和恢复功能

3. **离线功能**: 支持离线使用和数据同步
   - 使用IndexedDB提供更强大的客户端存储
   - 实现离线工作和联网同步机制

## 数据流

1. **前端到后端**:
   - 前端通过Axios发送HTTP请求到后端API
   - 请求中包含必要的参数和数据

2. **后端处理**:
   - 后端API接收请求并验证数据
   - 执行业务逻辑处理
   - 返回处理结果

3. **前端更新**:
   - 前端接收API响应
   - 更新React状态
   - 重新渲染UI展示新数据

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

### Python规范

- 遵循PEP 8风格指南
- 使用蛇形命名法(snake_case)
- 函数和方法应包含文档字符串

## 测试

### 前端测试

- 使用Jest进行单元测试
- 使用React Testing Library进行组件测试
- 运行测试: `npm test`

### 后端测试

- 使用pytest进行单元测试
- 运行测试: `pytest`

## 部署

### 部署前准备

1. 前端构建生产版本:
   ```bash
   cd frontend
   npm run build
   ```

2. 后端准备:
   - 确保requirements.txt包含所有依赖
   - 配置生产环境的config.py

### 部署选项

- **服务器部署**: 使用Nginx+Gunicorn部署
- **容器化部署**: 使用Docker和Docker Compose
- **PaaS部署**: 部署到Heroku、Vercel等平台 