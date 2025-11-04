# 羽毛球比赛管理工具 - 前端

羽毛球比赛管理工具的前端实现，基于React、TypeScript和Ant Design。

## 特点

- 使用React 18和TypeScript构建的现代化前端应用
- 采用Ant Design作为UI组件库，提供美观一致的用户界面
- 实现了响应式设计，适配不同设备尺寸
- 本地存储功能，使用localStorage保存比赛数据
- 直观的赛程管理界面，支持列表和矩阵两种视图

## 项目结构

```
src/
├── components/      # 可复用 UI 组件
├── pages/           # 页面组件（统筹、队伍、赛程、数据管理等）
├── types/           # TypeScript 类型定义
├── App.tsx          # 路由及页面骨架
├── main.tsx         # React 入口
├── store.tsx        # Context + localStorage 持久化
├── data-utils.ts    # 赛程生成 / 导入导出逻辑
└── utils.ts         # 通用工具函数
```

## 主要功能模块

- 队伍管理：创建和管理参赛队伍与队员
- 比赛配置：设置比赛参数和规则
- 赛程生成：自动生成比赛时间表和场地分配
- 比赛管理：记录比分、更换队员等操作
- 数据统计：查看比赛统计数据和排名

## 开发环境配置

1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 构建生产版本
```bash
npm run build
```

## 部署

构建完成后，`dist` 目录中生成的文件可以部署到任何静态文件服务器。 
