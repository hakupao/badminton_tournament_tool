# 羽毛球赛事管理系统 - API文档

## 基本信息

- **基础URL**: `http://localhost:5000`
- **响应格式**: 所有API均返回JSON格式数据
- **错误处理**: 错误时返回带有错误信息的JSON对象
- **跨域**: 所有API已启用CORS，支持跨域请求
- **架构说明**: 当前版本加入了后端数据库，主要数据通过API存取，前端负责展示和交互

## API列表

### 健康检查

#### GET /api/health

检查API服务的健康状态。

**请求参数**: 无

**响应示例**:
```json
{
  "status": "ok",
  "message": "羽毛球赛事管理系统 MVP 版本"
}
```

### 数据接口

#### GET /api/players

返回所有选手信息。

#### POST /api/players

向数据库添加新的选手。

#### GET /api/matches

返回所有比赛数据。

#### POST /api/matches

向数据库保存一场比赛记录。

## 前端API接口

历史版本中，大部分功能直接在前端实现，数据保存在浏览器的localStorage。以下内容记录旧版的前端数据接口：

### 本地存储键

前端使用以下localStorage键存储数据：

| 键名 | 描述 |
|------|------|
| tournamentConfig | 比赛配置信息 |
| tournamentTeams | 队伍信息 |
| tournamentPlayers | 队员信息 |
| tournamentSchedule | 赛程信息 |
| tournamentMatches | 比赛详情 |

### 前端数据结构

#### Match对象

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
  scores: {
    set: number;
    teamAScore: number;
    teamBScore: number;
  }[];
  winner_TeamId?: string;
  createdAt: string;
}
```

#### PlayerInfo对象

```typescript
interface PlayerInfo {
  code: string;      // 如 A1, B2
  name: string;
  teamCode: string;  // 如 A, B
  playerNumber: number; // 如 1, 2
}
```

#### TournamentConfig对象

```typescript
interface TournamentConfig {
  teamCount: number;
  teamCapacity: number;
  formations: string[];
  courtCount: number;
  matchDuration: number;
}
```

## 错误处理

前端API请求使用axios拦截器统一处理错误：

```javascript
// API请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// API响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    if (!error.response) {
      throw new Error('网络错误，请检查后端服务是否正在运行');
    }
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    // 根据状态码返回不同的错误信息
    switch (error.response?.status) {
      case 400:
        throw new Error('请求参数错误');
      case 404:
        throw new Error('请求的资源不存在');
      case 500:
        throw new Error('服务器内部错误');
      default:
        throw new Error(`请求失败: ${error.message}`);
    }
  }
);
```

## 开发说明

### 前后端交互

当前版本的前后端交互非常简单，仅包含健康检查API。大部分数据操作都在前端完成并保存在localStorage中。

### 未来扩展

随着项目发展，可能会增加以下API：

1. 队伍和队员管理API
2. 比赛记录和更新API
3. 赛程生成和管理API
4. 数据分析和统计API

## 开发示例

### 健康检查API调用

```javascript
import axios from 'axios';

const checkHealth = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('服务器状态:', response.data);
    return response.data;
  } catch (error) {
    console.error('健康检查失败:', error);
    return { status: 'error', message: error.message };
  }
};
``` 