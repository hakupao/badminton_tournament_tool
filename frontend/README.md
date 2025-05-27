# 羽毛球赛事管理系统 - 前端

## 项目概述

前端基于React + TypeScript + Ant Design开发，提供了直观友好的用户界面，用于管理羽毛球赛事的各个方面。

## 技术栈

- **React 18**: 前端UI框架
- **TypeScript**: 静态类型检查
- **Ant Design**: UI组件库
- **React Router**: 客户端路由
- **Vite**: 构建工具和开发服务器
- **Axios**: HTTP客户端

## 功能模块

- **比赛统筹**: 整体赛事设置和配置
- **队伍管理**: 添加、编辑和删除参赛队伍
- **阵容配置**: 设置比赛阵容和选手搭配
- **赛程生成**: 生成比赛时间表
- **比赛管理**: 更新比赛结果和分数
- **数据管理**: 数据统计和分析

## 项目结构

```
frontend/
├── src/                  # 源代码目录
│   ├── pages/            # 页面组件
│   ├── components/       # 可复用组件
│   ├── api.ts            # API请求函数
│   ├── store.tsx         # 全局状态管理
│   ├── types.ts          # TypeScript类型定义
│   ├── utils.ts          # 工具函数
│   ├── data-utils.ts     # 数据处理工具
│   ├── App.tsx           # 应用主组件
│   └── main.tsx          # 应用入口点
├── public/               # 静态资源
├── package.json          # 项目依赖和脚本
├── tsconfig.json         # TypeScript配置
└── vite.config.ts        # Vite配置
```

## 开发指南

### 环境准备

确保已安装Node.js (推荐v16+)

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 页面路由

- `/tournament-setup` - 比赛统筹
- `/teams` - 队伍管理
- `/formations` - 阵容配置
- `/schedule` - 赛程生成
- `/matches` - 比赛管理
- `/data` - 数据管理

## 状态管理

本项目使用React Context API进行状态管理，主要状态管理逻辑位于`src/store.tsx`文件中。

## 与后端交互

API请求集中在`src/api.ts`文件中，使用Axios库与后端进行通信。后端API基地址在开发环境中默认为`http://localhost:5000`。 