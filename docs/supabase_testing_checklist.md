# Supabase 集成自测清单

以下步骤覆盖 `docs/supabase_integration_todo.md` 中已标记为完成 (`[x]`) 的任务。执行前，请确认已经安装依赖（`npm install`）并能在项目根目录运行命令。

## 通用准备
- **环境变量占位**：如尚未拿到真实 Supabase 凭据，可在 `frontend/.env.local` 中填入占位值（例如 `http://localhost`、`test-key`），用于验证构建与运行流程。
- **清理旧数据**：测试涉及本地缓存时，在浏览器开发者工具 `Application → Local Storage` 中清除 `badminton_*` 与 `tournament*` 相关 key，或执行 `localStorage.clear()`。

## Step 2 – 本地与部署环境配置（已完成项）
1. **SDK 安装**  
   - 运行 `cd frontend && npm ls @supabase/supabase-js`  
   - 预期：输出安装版本且无 `empty`/`missing` 报错。
2. **.gitignore 覆盖**  
   - 打开 `.gitignore`，确认包含 `frontend/.env.local`。  
   - 新建 `frontend/.env.local` 并写入占位值后执行 `git status`，确认文件未被标记为未跟踪。

## Step 3 – 封装 Supabase 客户端
1. **构建通过**  
   - 在 `frontend` 目录执行 `npm run build`，确保 `src/lib/supabaseClient.ts` 编译正常。
2. **缺失配置提示**  
   - 暂不填写 `.env.local`，运行 `npm run dev`，在浏览器打开页面。  
   - 预期：控制台中打印 “Supabase 未配置” 类似的错误提示，UI 顶部显示 `离线模式` 标签。
3. **配置后无告警**  
   - 填写 `.env.local` 占位值、重启 `npm run dev`。  
   - 预期：控制台不再出现缺失提示，`离线模式` 标签消失（若无真实 Supabase 仍会在 AuthGate 阶段提示登录未完成）。

## Step 4 – 用户身份状态管理
1. **离线模式回退**（无 Supabase 凭据）  
   - 按上一节步骤启动应用，确认所有页面可访问，顶部 `Tag` 显示 “离线模式”。  
   - 进入任意页面，应直接看到内容，未出现登录拦截。
2. **在线模式登录流程**（需要真实 Supabase 项目）  
   - 在 Supabase 控制台启用 Email OTP，填入合法 `VITE_SUPABASE_URL`/`ANON KEY`。  
   - 重新启动应用，访问页面应显示登录表单；输入邮箱后收到一次性链接，完成登录后顶部显示邮箱 + “退出”按钮。
3. **登出流程**  
   - 登录状态下点击 “退出”，确认用户标识清除且重新出现登录提示（或离线模式标签）。

## Step 5 – 数据访问层迁移（已完成部分）
1. **默认数据导入（离线）**  
   - 清空 Local Storage，确保 `.env.local` 保持占位值（或不配置）。  
   - 刷新页面后进入队伍管理/阵容配置，确认默认数据自动填充并仅首次写入 `badminton_*` key。  
   - 控制台无未捕获异常。
2. **AppProvider 状态回写**  
   - 在比赛统筹页面修改配置并保存。  
   - 刷新页面，验证修改结果仍存在（读取自 `dataService` → Local Storage）。  
   - 打开浏览器 Local Storage，确认对应条目更新。
3. **阵容管理 Supabase 接口**  
   - 在阵容配置页面调整并保存队伍阵容。  
   - 若处于离线模式：刷新页面后检查阵容保持；Local Storage 中 `tournamentFormations` 更新。  
   - 若处于在线模式：使用 Supabase Table Editor 检查 `formations` 表的数据变化；刷新页面验证读取来自 Supabase。

## Step 6 – 默认数据导入流程（已完成部分）
1. **首次导入成功**  
   - 清空 Local Storage & Supabase 对应表（若已上线）。  
   - 以新用户登录或在无用户环境访问应用，等待首页加载。  
   - 浏览器控制台应无报错，`badminton_default_seed_version` 被写入；Supabase 表中出现默认数据。
2. **重复进入不再导入**  
   - 刷新页面或重新登录同一账号。  
   - 验证未重复插入默认记录；控制台无新的导入日志。  
   - Supabase `default_import_state`（或 Local Storage Marker）记录最新导入版本。

## Step 7 – 页面与状态更新（已完成部分）
1. **比赛统筹页面**  
   - 进入 `比赛统筹`，检查加载态（`Spin`）短暂出现后数据就绪。  
   - 修改配置、保存并刷新，确认数据持久化。  
   - 若在线模式，检查 Supabase `tournament_configs` 表同步更新。
2. **队伍管理页面**  
   - 检查加载转圈 / 缺少配置提示是否符合预期。  
   - 编辑队员姓名并保存，刷新页面数据保持；在线模式下 Supabase `players` 表同步更新。
3. **阵容配置页面**  
   - 切换队伍时加载正确的阵容，自动生成按钮可批量生成默认值。  
   - 保存后刷新页面或使用 Supabase Table Editor 校验 `formations` 表数据。

> **提示**：赛程生成、比赛管理、数据管理尚未迁移到数据服务，相关测试将待后续任务完成后补充。

