# 羽毛球赛事管理系统 - API文档

## 基本信息

- **基础URL**: `http://localhost:5000`
- **响应格式**: 所有API均返回JSON格式数据
- **错误处理**: 错误时返回带有错误信息的JSON对象
- **跨域**: 所有API已启用CORS，支持跨域请求

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

### 数据分析接口

#### GET /api/data/consecutive-matches

获取在连续两个时间段都比赛的选手。

**请求参数**: 无（使用服务器内存中的数据）

**响应示例**:
```json
[
  {
    "id": "player1_slot1_slot2",
    "player": "player1",
    "timeSlot1": "09:00-10:00",
    "timeSlot2": "10:00-11:00"
  },
  {
    "id": "player2_slot2_slot3",
    "player": "player2",
    "timeSlot1": "10:00-11:00",
    "timeSlot2": "11:00-12:00"
  }
]
```

#### GET /api/data/inactive-players

获取在连续三个时间段都没有参加比赛的选手。

**请求参数**: 无（使用服务器内存中的数据）

**响应示例**:
```json
[
  {
    "id": "player3_inactive",
    "player": "player3",
    "lastMatchTime": "09:00-10:00"
  },
  {
    "id": "player4_inactive",
    "player": "player4",
    "lastMatchTime": "从未参赛"
  }
]
```

#### GET /api/data/group-rankings

获取循环赛中每个团体的实时排名。

**请求参数**: 无（使用服务器内存中的数据）

**响应示例**:
```json
[
  {
    "id": "team1",
    "group": "team1",
    "wins": 5,
    "losses": 1,
    "winRate": 0.833
  },
  {
    "id": "team2",
    "group": "team2",
    "wins": 3,
    "losses": 3,
    "winRate": 0.5
  }
]
```

#### GET /api/data/player-win-rates

获取每个参加比赛的选手的胜率。

**请求参数**: 无（使用服务器内存中的数据）

**响应示例**:
```json
[
  {
    "id": "player1",
    "player": "player1",
    "wins": 8,
    "total": 10,
    "winRate": 0.8
  },
  {
    "id": "player2",
    "player": "player2",
    "wins": 6,
    "total": 10,
    "winRate": 0.6
  }
]
```

#### GET /api/data/pair-win-rates

获取每个组合的胜率。

**请求参数**: 无（使用服务器内存中的数据）

**响应示例**:
```json
[
  {
    "id": "player1_player2",
    "pair": "player1 & player2",
    "wins": 5,
    "total": 6,
    "winRate": 0.833
  },
  {
    "id": "player3_player4",
    "pair": "player3 & player4",
    "wins": 4,
    "total": 6,
    "winRate": 0.667
  }
]
```

### 数据更新接口

#### POST /api/matches

更新比赛数据到服务器内存中。

**请求体**:
```json
{
  "matches": [
    {
      "id": "match1",
      "timeSlot": "09:00-10:00",
      "players": ["player1", "player2", "player3", "player4"],
      "groups": ["team1", "team2"],
      "status": "completed",
      "winner": "team1",
      "winningPlayers": ["player1", "player2"],
      "winningPairs": [["player1", "player2"]]
    }
  ],
  "timeSlots": ["09:00-10:00", "10:00-11:00", "11:00-12:00"]
}
```

**响应示例**:
```json
{
  "status": "ok"
}
```

## 错误处理

所有API在发生错误时将返回适当的HTTP状态码和错误信息。

**示例错误响应**:
```json
{
  "error": "发生错误",
  "message": "详细错误信息",
  "status": "error"
}
```

常见HTTP状态码:
- `200 OK`: 请求成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 数据结构

### 比赛对象

比赛对象的字段说明:

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 比赛唯一标识符 |
| timeSlot | string | 比赛时间段 |
| players | string[] | 参赛选手列表 |
| groups | string[] | 参赛团队列表 |
| status | string | 比赛状态，可选值: "pending", "ongoing", "completed" |
| winner | string | 获胜团队（仅当status为completed时有效） |
| winningPlayers | string[] | 获胜选手列表 |
| winningPairs | string[][] | 获胜组合列表 |

## 开发示例

### 使用Axios调用API

```javascript
import axios from 'axios';

// 获取选手胜率数据
const getPlayerWinRates = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/data/player-win-rates');
    return response.data;
  } catch (error) {
    console.error('获取选手胜率失败:', error);
    return [];
  }
};

// 更新比赛数据
const updateMatches = async (matches, timeSlots) => {
  try {
    const response = await axios.post('http://localhost:5000/api/matches', {
      matches,
      timeSlots
    });
    return response.data;
  } catch (error) {
    console.error('更新比赛数据失败:', error);
    throw error;
  }
};
``` 