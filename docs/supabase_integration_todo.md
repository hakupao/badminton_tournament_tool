# Supabase 集成待办

## 1. 初始化 Supabase 项目
- 注册 Supabase，创建项目并记录 `Project URL`、`anon/service keys`
- 在数据库中新建表（`tournament_configs`、`players`、`matches`、`time_slots`、`formations`、`schedules`），字段包含 `user_id`、时间戳
- 对每张表开启 RLS，编写策略仅允许 `auth.uid()` 访问自己的数据
- 在 Authentication 面板启用登录方式（邮箱 OTP 或第三方），完善邮件模板/凭据

## 2. 本地与部署环境配置
- [x] 安装 SDK：在前端运行 `npm install @supabase/supabase-js`
- [ ] 在项目根目录创建 `.env.local`，填写 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
- [x] 更新 `.gitignore` 排除 `.env.local`
- [ ] 在 Vercel 项目面板同步设置上述环境变量

## 3. 封装 Supabase 客户端
- [x] 在 `src/lib/supabaseClient.ts` 内读取环境变量并调用 `createClient`
- [x] 提供 CRUD 助手函数（查询、批量写入、事务/错误处理）
- [x] 输出统一的错误日志与返回结果格式

## 4. 用户身份状态管理
- [x] 新增 Auth Provider：监听 `auth.onAuthStateChange`，维护 `user`、`isLoading`
- [x] 在全局 Context（或 `AppProvider`）暴露 `signIn`、`signOut`、`user`
- [x] 为 UI 添加登录/退出入口，未登录时拦截受限页面或提示登录

## 5. 数据访问层迁移
- [x] 构建 `src/services/dataService.ts`，内部通过 Supabase API 操作数据
- [x] 实现对比赛、配置、阵容、时间段的读取/写入接口
- [x] 保留 `localStorage` 缓存：启动时优先读缓存，再同步 Supabase；离线时降级
- [ ] 所有页面调用统一的数据服务层，而非直接访问 `localStorage`（赛程/比赛管理页面仍待迁移）

## 6. 默认数据导入流程
- [x] 在用户首次登录且 Supabase 中无记录时，将 `default-data.json` 拆分写入各表
- [x] 实现批量导入函数（按顺序执行或使用事务），导入后写入“已导入”标记
- [ ] 处理导入失败的回滚/错误提示（待真实 Supabase 环境验证）

## 7. 页面与状态更新
- [x] 修改页面组件的数据源，从数据服务层获取并处理 Loading/Error 状态（已覆盖比赛统筹、队伍管理、阵容配置）
- [x] 更新保存按钮、表单提交逻辑，使用 API 写入并刷新缓存
- [ ] 确保跨设备登录能看到一致数据（赛程/比赛/统计页面待迁移并验证）

## 8. 统计与报表适配
- 审核 `data-utils.ts`：确认前端即可计算的留在前端
- 若数据量较大，考虑创建 Supabase SQL 视图/存储过程或 Edge Function 提供聚合
- 更新报表页面调用新的数据来源

## 9. 测试与验证
- 本地测试：注册测试用户，验证登录、首次导入、更新、重登
- 按流程编写手动/自动测试：登录 → 配置 → 更新比赛 → 切换账号验证隔离
- Vercel Preview 部署测试环境变量加载与 API 调用

## 10. 上线与运维
- 更新项目文档：说明登录流程、权限策略、数据存储位置
- 配置 Supabase 备份策略，必要时编写导出/备份脚本
- 监控 Supabase 和 Vercel 日志，关注配额/错误
