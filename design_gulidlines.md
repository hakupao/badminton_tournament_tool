# 羽毛球赛事管理工具前后端分离架构指南

## 前后端分离架构建议

### 后端建议架构
1. **API 服务器**
   - RESTful API
   - 数据库存储 MongoDB
   - 业务逻辑处理 (核心为赛程编排)

2. **主要功能模块**
   - 赛事信息配置模块
   - 队伍和队员管理模块
   - 阵容管理模块
   - 赛程生成和管理模块 (需考虑不同比赛模式和自定义对阵结构)
   - 比赛结果记录模块
   - 数据统计和分析模块 (基础表格展示)

3. **核心算法迁移**
   - 赛程编排算法 (基于队伍、阵容、场地、时间、比赛模式、对阵结构等条件的动态规划)
   - 统计计算逻辑
   - 数据验证逻辑

### 前端建议架构
1. **现代前端框架**
   - React
   - 响应式设计，适配移动端 (可选，优先保证桌面端核心功能)
   - 组件化架构

2. **状态管理**
   - Redux（React） 或 React Context (根据复杂度选择)
   - 集中式状态管理

3. **API 交互**
   - Axios
   - API 请求封装
   - 错误处理和加载状态管理

## API 接口设计建议

### 赛事信息配置 (针对当前唯一赛事)
- `GET /api/tournament`: 获取当前赛事信息
- `POST /api/tournament`: 初始化/创建当前赛事信息 (如名称、赛制基础设定、比赛模式、团体对阵结构)
- `PUT /api/tournament`: 更新当前赛事信息 (如名称、赛制基础设定、比赛模式、团体对阵结构)
- `DELETE /api/tournament`: 清空/重置当前赛事数据 (谨慎操作)

### 队伍管理 (属于当前赛事)
- `GET /api/teams`: 获取当前赛事所有队伍
- `GET /api/teams/:teamId`: 获取特定队伍详情
- `POST /api/teams`: 创建新队伍 (自动关联到当前赛事)
- `PUT /api/teams/:teamId`: 更新队伍信息
- `DELETE /api/teams/:teamId`: 删除队伍

### 队员管理 (属于特定队伍)
- `GET /api/teams/:teamId/players`: 获取队伍所有队员
- `GET /api/players/:playerId`: 获取特定队员详情
- `POST /api/players`: 添加新队员 (需指定所属队伍ID，并预设技术水平等级)
- `PUT /api/players/:playerId`: 更新队员信息 (包括技术水平等级，但比赛开始后不建议修改)
- `DELETE /api/players/:playerId`: 删除队员

### 阵容管理 (核心，用于赛程生成)
- `POST /api/teams/:teamId/formations`: 为队伍配置特定类型比赛的阵容 (如男双1, 男双2, 混双1，基于队员预设技术水平选择)
- `GET /api/teams/:teamId/formations`: 获取队伍所有已配置的阵容
- `GET /api/formations/:formationId`: 获取特定阵容详情
- `PUT /api/formations/:formationId`: 更新阵容信息 (如调整队员)
- `DELETE /api/formations/:formationId`: 删除某个阵容配置

### 赛程管理 (基于当前赛事和已配置的阵容)
- `GET /api/schedules`: 获取当前赛事已生成的赛程方案列表
- `POST /api/schedules/generate`: 生成赛程方案 (核心功能，后端根据队伍、阵容、赛事设置、比赛模式、团体对阵结构进行复杂运算)
    - 请求体可能包含：参与队伍ID列表, 各队伍选定的阵容ID, 场地数量, 时间限制等。
- `GET /api/schedules/:scheduleId`: 获取特定赛程方案详情
- `PUT /api/schedules/:scheduleId/select`: 选择激活特定赛程方案用于比赛
- `DELETE /api/schedules/:scheduleId`: 删除某个赛程方案

### 比赛管理 (基于选定的赛程方案)
- `GET /api/schedules/:scheduleId/matches`: 获取选定赛程方案下的所有比赛
- `GET /api/matches/:matchId`: 获取特定比赛详情
- `PUT /api/matches/:matchId/scores`: 更新比赛比分
- `PUT /api/matches/:matchId/status`: 更新比赛状态（未开始、进行中、已结束）

### 统计分析 (基础数据展示)
- `GET /api/statistics/teams`: 获取队伍排名和基础统计 (基于已结束比赛)
- `GET /api/statistics/players`: 获取队员基础统计 (基于已结束比赛)

## 数据库设计建议

### 主要实体
1. **Tournament (赛事)** - 系统内只有一条记录，代表当前赛事配置
   - id: 唯一标识符 (可固定为已知ID，如 "current_tournament")
   - name: 赛事名称
   - format: 赛制描述（如团体循环赛，或团体循环赛后接淘汰赛）
   - startTime: 开始时间 (可选)
   - settings: 赛事设置（详细配置如下）
     - `gameType`: "doubles_team" (固定为双打团体赛)
     - `matchMode`: `'round-robin' | 'round-robin-knockout'` (比赛模式：纯循环赛 或 循环淘汰组合赛)
     - `teamSizeMin`: 最小队伍人数 (可选)
     - `teamSizeMax`: 最大队伍人数 (可选)
     - `encounterMatchStructure`: (Array of objects) 定义团体间一次对抗的比赛构成。例如:
        ```json
        [
          { "matchOrder": 1, "description": "第一男双", "formationTypeRefA": "MD1", "formationTypeRefB": "MD1" },
          { "matchOrder": 2, "description": "第一混双", "formationTypeRefA": "XD1", "formationTypeRefB": "XD1" },
          { "matchOrder": 3, "description": "第二男双", "formationTypeRefA": "MD2", "formationTypeRefB": "MD2" }
        ]
        ```
        (`formationTypeRefA` 和 `formationTypeRefB` 指的是对阵双方队伍应派出的阵容类型，该类型由 `Formation.type` 和 `Formation.matchIndex` 组合而成，如 "MD1" 代表队伍的"男双1号"阵容。)
     - `pointsPerWin`: 胜一场得几分 (团体赛计分规则)
     - `pointsPerLoss`: 负一场得几分 (团体赛计分规则, 可为0)
     - `pointsPerDraw`: 平一场得几分 (团体赛计分规则, 如果允许平局)
     - `courts`: 场地数量
     - `maxMatchesPerRound`: 每轮最大同时进行的比赛数量 (可选)
   - createdAt: 创建时间
   - updatedAt: 更新时间

2. **Team (队伍)**
   - id: 唯一标识符
   - name: 队伍名称
   - createdAt: 创建时间
   - updatedAt: 更新时间

3. **Player (队员)**
   - id: 唯一标识符
   - teamId: 所属队伍ID
   - name: 队员姓名
   - gender: 性别
   - skillLevel: 队内技术水平等级 (例如 1, 2, 3... 数字越小水平越高，比赛前预设确定，不会动态变化)
   - createdAt: 创建时间
   - updatedAt: 更新时间

4. **Formation (阵容)** - 核心实体，直接影响赛程
   - id: 唯一标识符
   - teamId: 所属队伍ID
   - type: 比赛类型（男双、女双、混双）
   - matchIndex: 队伍内部该类型比赛的序号（如男双1、男双2，结合队员 `skillLevel` 进行选择配置）
   - playerIds: 参赛队员ID数组 (注意顺序，如双打P1, P2)
   - createdAt: 创建时间
   - updatedAt: 更新时间

5. **Schedule (赛程)**
   - id: 唯一标识符
   - name: 赛程方案名称 (如 "初步方案", "优化方案A")
   - isSelected: 是否被选为当前激活使用的赛程
   - generationParams: 生成此赛程时使用的参数快照 (可选，用于追溯)
   - createdAt: 创建时间
   - updatedAt: 更新时间

6. **Match (比赛)**
   - id: 唯一标识符
   - scheduleId: 所属赛程ID
   - round: 轮次 (或比赛序号)
   - teamA_Id: 队伍A的ID
   - teamB_Id: 队伍B的ID
   - matchType: 比赛类型（男双、女双、混双） - 从 `Tournament.encounterMatchStructure` 中此场比赛定义的类型获取
   - specificMatchOrderInEncounter: 在本次团体对抗中的场次顺序 (例如第1场，第2场，对应 `Tournament.encounterMatchStructure` 中的 `matchOrder`)
   - teamA_FormationId: 队伍A使用的阵容ID (用于追溯)
   - teamB_FormationId: 队伍B使用的阵容ID (用于追溯)
   - teamAPlayers: 队伍A实际参赛队员ID列表 (冗余存储，来自阵容)
   - teamBPlayers: 队伍B实际参赛队员ID列表 (冗余存储, 来自阵容)
   - court: 场地号 (由后端赛程编排算法分配)
   - startTimeActual: 实际或预计比赛开始时间 (由后端赛程编排算法分配)
   - status: 比赛状态（未开始、进行中、已结束）
   - scores: 比分数组 (例如: `[{set: 1, teamAScore: 21, teamBScore: 19}, ...]`)
   - winner_TeamId: 获胜队伍ID (如果有)
   - createdAt: 创建时间
   - updatedAt: 更新时间

## 后端技术栈建议

### 编程语言和框架
- Python + Django/Flask (Flask可能更轻量适合此场景)

### 数据库
- MongoDB（适合快速开发和灵活的数据结构，特别是赛程和比赛的动态属性）

### 开发工具
- RESTful API 文档生成工具（如 Swagger/OpenAPI）
- 单元测试框架
- ODM 工具 (如 MongoEngine for Flask/Django)

## 前端技术栈建议

### 框架
- React + React Router

### 状态管理
- Redux/React Context (React) - 根据实际复杂度选用，Context API可能已足够

### UI 组件库
- Ant Design

## 开发阶段建议

### 阶段划分
1. **阶段一：核心后端服务构建**
   - 设计和实现数据库核心实体 (Tournament, Team, Player, Formation)
   - 开发队伍、队员、阵容管理API
   - 实现核心的赛程生成算法 (`POST /api/schedules/generate`) 及相关比赛记录生成逻辑。这是项目的关键。

2. **阶段二：核心前端页面与交互**
   - 使用 Ant Design 构建基础界面：赛事信息配置、队伍管理、队员管理、阵容配置。
   - 实现前端与核心API的对接，重点是阵容的提交和赛程生成请求的发起。
   - 展示生成的赛程和比赛列表。
   - 实现比赛结果的录入功能。

3. **阶段三：完善与优化**
   - 实现基础的统计数据展示。
   - 优化赛程生成算法的效率和结果。
   - 根据使用反馈进行调整和用户体验优化。

### 优先实现的核心功能
1. **数据模型与存储**：Tournament, Team, Player, Formation, Schedule, Match。确保 `Tournament` 包含 `matchMode` 和 `encounterMatchStructure`，`Player` 包含 `skillLevel`。
2. **阵容配置功能**：前端界面让用户可以为每个队伍的每个项目（男双1，男双2，混双1等，根据 `encounterMatchStructure` 的需求）指定队员，可参考队员的 `skillLevel`。
3. **赛程编排核心算法**：后端根据赛事设置（特别是 `matchMode` 和 `encounterMatchStructure`）、队伍阵容、场地数量等动态规划生成比赛日程表。这是技术难点和核心价值。
4. **比赛结果录入与展示**。
5. **基础数据统计** (基于团体赛的胜负和可能的积分制)。
