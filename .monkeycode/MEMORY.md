# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
User instruction entries should follow this format:

[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
Entries discovered by the Agent during task execution should follow this format:

[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Deduplication Strategy
- Before adding a new entry, check for similar or identical instructions.
- If a duplicate is found, skip the new entry or merge it with the existing one.
- When merging, update the context or date information.
- This helps avoid redundant entries and keeps the memory file tidy.

## Entries

[Project Knowledge Summary]
- Date: 2026-09-29
- Context: Discovered by Agent while building the Culture2Action MVP (frontend-backend separated web app)
- Category: Operations & Deployment / Build Methods / Environment Configuration
- Instructions:
  - 项目为 npm workspaces 单仓库：根目录统一执行 `npm install`，会同时安装 `server` 与 `web`。
  - 启动开发环境：`npm run dev`（根目录）；后端监听 3001，前端 Vite 监听 5173，对外暴露端口为 5173。
  - 前端通过 `web/vite.config.js` 的 proxy 将 `/api` 反向代理到 `http://localhost:3001`，不要改成直连后端地址。
  - 数据库使用 Node 内置 `node:sqlite`（实验特性），所有 node 脚本需加 `NODE_NO_WARNINGS=1` 关闭告警。
  - 初始化/重置数据：`npm run seed`（幂等）。重置需删除 `server/data/culture2action.db` 后重新 seed。
  - 演示账号：手机号 `13800000000`，密码 `123456`。
  - LLM 能力默认走内置规则引擎；接入大模型时由用户在根目录 `.env` 自行填写 `USER_LLM_*`，不得读取或使用环境/平台预置密钥。
  - 前端构建（`npm run build`）与任何 node 构建任务必须使用受管理的后台终端执行，避免资源无约束占用。
