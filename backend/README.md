# 羽毛球赛事管理系统 - 后端 MVP

## 功能特点
- 队伍和队员管理
- 阵容配置（男双1、男双2、混双1）
- 自动赛程生成（基于贪心算法）
- 比赛结果记录

## 安装步骤

1. 安装MongoDB
   - 下载并安装 MongoDB Community Edition
   - 启动 MongoDB 服务

2. 安装Python依赖
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. 配置环境变量
   - 复制 `.env.example` 为 `.env`
   - 根据需要修改配置

## 启动服务

```bash
python app.py
```

服务将在 http://localhost:5000 启动

## API 使用示例

### 1. 创建队伍
```bash
POST /api/teams
{
  "name": "雄鹰队"
}
```

### 2. 添加队员
```bash
POST /api/players
{
  "teamId": "队伍ID",
  "name": "张三",
  "gender": "M",
  "skillLevel": 1
}
```

### 3. 配置阵容
```bash
POST /api/teams/{teamId}/formations
{
  "type": "MD1",
  "playerIds": ["player1_id", "player2_id"]
}
```

### 4. 生成赛程
```bash
POST /api/schedules/generate
{
  "courtsCount": 4
}
```

### 5. 查看比赛
```bash
GET /api/matches
```

## 核心算法说明

赛程生成采用贪心算法：
1. 生成所有团体对抗的比赛
2. 按时间段逐个安排比赛
3. 确保同一时间段选手不冲突
4. 尽量避免选手连续比赛

## 注意事项

- MVP版本固定为3个项目：男双1、男双2、混双1
- 每个队伍必须配置完整的3个阵容才能生成赛程
- 数据存储在MongoDB中 