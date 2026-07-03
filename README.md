# VertaX — AI 驱动的 B2B 获客平台

一站式 B2B 获客解决方案：知识库 RAG、AI 内容工坊、线索管理 CRM、数据分析 Dashboard、独立站生成。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + React 19 |
| UI 组件 | shadcn/ui + Tailwind CSS v4 |
| 后端 API | Next.js API Routes |
| 数据库 | PostgreSQL (Supabase) |
| 认证 | JWT (jose) + bcrypt |
| AI/LLM | 智谱 GLM API (可替换) |
| 向量搜索 | pgvector + Embedding |
| 邮件 | Resend |
| 测试 | Playwright (E2E) |
| 部署 | Vercel |

## 功能模块

- **知识库 RAG** — 上传 PDF/Word/Markdown，自动解析分块向量化，AI 精准问答
- **AI 内容工坊** — 多模板多语言文案生成、SEO 优化、版本管理、内容分析
- **线索管理 CRM** — 线索录入、状态流转、CSV 导入导出、跟进提醒
- **数据分析 Dashboard** — 统计卡片、月度趋势图表、内容排行榜
- **AI 独立站生成** — 3 套模板、AI 生成内容、SEO 优化、一键发布
- **团队协作** — 4 级权限（Owner/Admin/Editor/Viewer）、通知系统、操作日志
- **开放 API** — RESTful API v1 + API Key 认证 + 速率限制
- **Webhook** — 事件推送 + HMAC-SHA256 签名验证

## 快速开始

### 前提条件

- Node.js 18+
- Supabase 账号（免费）
- 智谱 AI API Key（或其他 LLM API）

### 1. 克隆项目

```bash
git clone https://github.com/caosir888/vertax.git
cd vertax
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.local` 并填入实际值：

```env
# 数据库 (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 密钥（生成方式：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"）
JWT_SECRET=your-random-64-char-hex

# AI API (智谱 GLM)
ZHIPU_API_KEY=your-zhipu-api-key

# 邮件 (Resend) — 可选
RESEND_API_KEY=your-resend-api-key
```

### 4. 初始化数据库

在 Supabase SQL Editor 中依次执行：

1. `supabase_schema.sql` — 建表
2. `migration_day25.sql` ~ `migration_day80.sql` — 增量迁移
3. （可选）`seed_demo.sql` — 演示数据

### 5. 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000`，注册账号即可开始使用。

### Demo 账号

执行 `seed_demo.sql` 后可用以下账号登录：

- 邮箱：`demo@vertax.ai`
- 密码：`demo123456`

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 注册/登录
│   ├── (dashboard)/        # 后台管理页面
│   ├── api/                # API 路由 (75 个端点)
│   │   └── v1/             # 开放 API
│   ├── pricing/            # 定价页
│   └── admin/              # 平台管理后台
├── components/             # React 组件
│   └── ui/                 # shadcn/ui 基础组件
├── lib/                    # 工具库 (20 个模块)
│   ├── auth.ts             # JWT 认证
│   ├── supabase.ts         # 数据库客户端
│   ├── llm.ts              # LLM 调用
│   ├── embedding.ts        # 向量化
│   ├── email.ts            # 邮件发送
│   ├── webhook.ts          # Webhook 推送
│   ├── api-auth.ts         # API Key 验证
│   ├── rate-limit.ts       # 速率限制
│   ├── permissions.ts      # 权限控制
│   └── ...                 # 更多工具模块
└── types/                  # TypeScript 类型定义
```

## 常用命令

```bash
npm run dev        # 启动开发服务器 (Turbopack)
npm run build      # 生产构建
npm run lint       # ESLint 检查
npm test           # 运行 E2E 测试
npm test -- --ui   # E2E 测试 UI 模式
```

## 部署

项目已配置 Vercel 一键部署。关联 GitHub 仓库后，Vercel 会自动检测 Next.js 项目并配置构建命令。

需在 Vercel 环境变量中配置与 `.env.local` 相同的变量。

## License

MIT
