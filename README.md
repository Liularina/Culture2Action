# 文化落地引擎 Culture2Action

把抽象的企业文化价值观，变成每个阶段、每个流程节点上可执行、可观察、可培训的具体行动，并自动生成诊断报告、行为清单和培训课件。

> 核心公式：企业诊断 + 阶段判断 + 文化价值观 + 业务流程 + 行业场景 = 具体行为 + 培训课件 + 落地方案

## 功能范围（V1.0 MVP）

- 企业诊断：现状自述 + 高管行为测评 + 员工行为测评 + 诊断报告
- 企业阶段适配：S1 初创 / S2 成长 / S3 成熟 / S4 集团化
- 价值观库：预置 10 个价值观、42 个子维度，支持自定义
- 流程库：自建 7 套行业流程模板，支持自定义导入（文字 / 从 Excel 粘贴）
- 行为拆解引擎：价值观 × 流程节点 × 企业阶段 → 具体行动（含评估标准与案例）
- 课件生成器：行动 → 案例、讨论题、角色扮演脚本、考核点
- 课件导出：Word 优先，PPT 次之，支持单篇与批量
- 行业适配与对比：同价值观换行业流程 / 换阶段重新拆解并对比
- 行为清单查看与导出（Excel/CSV、PDF 打印）
- 专家审核：提交、匹配专家、审核结果与建议
- 按次付费：诊断 / 拆解 / 课件 / 审核 / 套餐，含免费体验
- 反馈与迭代

## 技术栈

- 前端：Vue 3 + Vue Router + Vite（端口 5173，对外暴露端口）
- 后端：Node.js + Express（端口 3001）
- 数据库：Node.js 内置 `node:sqlite`（无需额外原生依赖）
- 导出：`docx`（Word）、`pptxgenjs`（PPT）
- 前后端分离，前端通过 Vite 反向代理将 `/api` 转发到后端

> 环境要求：Node.js >= 22（使用内置 `node:sqlite` 与 `process.loadEnvFile`）。

## 快速开始

```bash
# 安装依赖（根目录，npm workspaces 会同时安装 server 与 web）
npm install

# 初始化数据库并写入预置数据（幂等，已初始化会自动跳过）
npm run seed

# 启动前后端（后端 3001，前端 5173）
npm run dev
```

访问 http://localhost:5173

也可以使用一键脚本（自动安装依赖、初始化数据库并启动）：

```bash
./start.sh
```

演示账号：`13800000000` / `123456`

## 目录结构

```
.
├── package.json          # workspaces 根配置与统一脚本
├── start.sh              # 一键启动脚本
├── .env.example          # 后端环境变量示例
├── server/               # Express 后端
│   └── src/
│       ├── index.js      # 服务入口与路由挂载
│       ├── seed.js       # 数据库初始化与预置数据
│       ├── lib/          # db / 规则引擎 / LLM 客户端 / 导出器
│       └── routes/       # auth / catalog / companies / diagnosis / generation / misc
└── web/                  # Vue 3 前端
    └── src/
        ├── api.js        # axios 风格 fetch 封装（统一 /api 前缀）
        ├── router.js     # 路由（hash 模式）
        ├── store.js      # 轻量登录态
        ├── views/        # 全部页面
        └── components/   # PaymentDialog 等
```

## AI 能力与规则引擎

系统支持两种内容生成方式，运行时可自动切换：

1. 规则引擎（默认，始终可用）：企业阶段判断、诊断分析、行为拆解、课件生成、行业适配均由内置模板与规则完成，功能完整、结果稳定、无需任何密钥。
2. 大模型增强（可选）：在项目根目录创建 `.env`，自行填写你自己的 OpenAI 兼容接口配置。

```bash
cp .env.example .env
```

```env
USER_LLM_API_KEY=你的Key
USER_LLM_BASE_URL=https://api.deepseek.com/v1
USER_LLM_MODEL=deepseek-chat
# 强制使用规则引擎
USE_RULE_ENGINE=false
```

说明：本项目不会读取或使用平台 / 执行环境中预置的任何密钥，只使用你在 `.env` 中自行提供的 `USER_LLM_*` 配置。未配置时自动回退到规则引擎。

## 主要接口

| 模块 | 接口 |
| --- | --- |
| 认证 | `POST /api/auth/register`、`POST /api/auth/login`、`GET/PUT /api/auth/me` |
| 企业 | `GET/POST /api/companies`、`GET/PUT /api/companies/:id` |
| 诊断 | `POST/GET /api/diagnoses`、`GET /api/diagnoses/:id/questions`、`POST /api/diagnoses/:id/answers`、`POST/GET /api/diagnoses/:id/report` |
| 价值观/流程 | `GET/POST /api/values`、`GET /api/processes`、`POST /api/processes/import`、`GET /api/stages` |
| 行为拆解 | `POST /api/actions/generate`、`GET /api/actions`、`POST /api/actions/adapt` |
| 课件 | `POST /api/courses/generate`、`GET/PUT /api/courses/:id`、`GET /api/courses/:id/export?format=word|ppt`、`POST /api/courses/export` |
| 专家审核 | `GET /api/experts`、`POST /api/reviews`、`POST /api/reviews/:id/complete` |
| 付费 | `GET /api/prices`、`POST /api/orders`、`POST /api/orders/:id/pay` |
| 其他 | `GET /api/home`、`GET /api/engine`、`POST /api/feedbacks` |

## 核心流程

完整诊断到课件：注册 → 企业诊断 → 现状自述 → 高管测评 → 员工测评 → 诊断报告 → 行为拆解 → 课件生成 → 专家审核（可选）→ 导出 → 付费。

快速拆解：行为拆解页选择价值观 + 行业流程 + 企业阶段 → 生成每个节点的行为清单 → 单节点生成课件 → 编辑 → 导出。

## 说明与限制

- 支付为演示实现：创建订单后通过 `POST /api/orders/:id/pay` 标记为已支付，未接入真实微信/支付宝。
- 专家审核为演示实现：提交后可通过“查看审核结果”生成审核意见，未接入真实专家系统。
- `node:sqlite` 为 Node.js 实验特性，启动脚本已通过 `NODE_NO_WARNINGS=1` 关闭相关告警。
- 数据库文件位于 `server/data/culture2action.db`，删除该文件后重新执行 `npm run seed` 可重置数据。
