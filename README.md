# claude-env

> Claude Code 环境基线管理工具 — 在任意新项目中一键核查你的 Skills、MCPs、Plugins 和 Hooks 是否就绪。

---

## 简介

每次打开一个新项目，你是否需要重新确认 `commit` skill 有没有装、MCP 有没有配好、常用插件有没有启用？
**claude-env** 把你的 Claude Code 使用习惯保存为一份「基线配置」，之后在任何项目目录执行 `claude-env check`，就能立刻看到哪些东西还没装、哪些已经就绪。

它**只做检测和提示，不会自动安装任何东西**。

```
claude-env check

  Claude 环境检测 — /Users/me/my-project

  Skills
  ✅ commit              已安装 🌍
  ✅ find-skills         已安装 🌍
  ❌ review-pr           基线中存在，但此项目未安装

  MCPs
  ✅ filesystem          已配置 🌍
  ❌ memory              基线中存在，但此项目未配置

  ────────────────────────────────────────
  ⚠️  2 项缺失，请参考上方清单手动安装。
```

---

## 安装

```bash
npm install -g claude-env
```

---

## 使用

### `claude-env init` — 初始化基线配置

首次使用，或想重新调整偏好时运行。启动一个交互式向导，从内置 Catalog 中选择你习惯使用的 Skills 和 MCPs，以及已检测到的 Plugins：

```bash
claude-env init
```

向导共分 2–3 步（有 Plugin 时为 3 步）：

| 步骤 | 内容 |
|------|------|
| 第 1 步 | 从 Catalog 中选择 **Skills** |
| 第 2 步 | 从 Catalog 中选择 **MCPs** |
| 第 3 步 | 从已检测到的本地安装中选择 **Plugins**（无 Plugin 时自动跳过）|
| 确认 | 预览所有选择，按 Enter 保存 |

基线配置保存于 `~/.claude-env/profile.json`。

#### 交互按键

| 按键 | 功能 |
|------|------|
| `↑` / `↓` | 在当前页内上下移动 |
| `←` / `→` | 翻页 |
| `空格` | 选中 / 取消当前项 |
| `/` | 进入搜索模式，按名称或描述过滤 |
| `f` | 循环切换活跃度筛选（`>500K` → `500K-200K` → … → `<1K` → 全部） |
| `Esc` | 搜索模式下：退出搜索；否则：返回上一步 |
| `↓` 到 `[ 保存并继续 → ]` + `Enter` | 确认当前步骤，进入下一步 |
| `q` | 随时退出 |

---

### `claude-env check` — 检查当前项目环境

在任意项目目录运行，对比基线，列出缺失项：

```bash
cd ~/my-project
claude-env check
```

检测范围：

| 类型 | 检测位置 |
|------|---------|
| Skills | `~/.claude/skills/` 🌍 及 `.claude/skills/` 📁 |
| MCPs | `~/.claude/settings.json`、`.mcp.json` 等 |
| Hooks | `~/.claude/settings.json` 及项目级配置 |
| Plugins | `~/.claude/plugins/installed_plugins.json` |

- 🌍 = 全局安装（所有项目共享）
- 📁 = 项目级安装（仅当前项目）

---

## 内置 Catalog

Catalog 收录了官方和高活跃社区的 Skills 与 MCPs，供 `init` 向导展示选择。
所有条目均包含安装量数据，可通过活跃度筛选快速找到适合自己的工具。

### Skills（14 项）

| 名称 | 描述 | 来源 |
|------|------|------|
| `commit` | 生成规范的 git commit message | 官方 |
| `review-pr` | 对 Pull Request 进行代码审查 | 官方 |
| `find-skills` | 发现并安装社区 skill | 官方 |
| `simplify` | 并行生成三个代理审查代码质量并优化 | 官方 |
| `batch` | 跨代码库大规模并行修改 | 官方 |
| `loop` | 按指定间隔重复运行 prompt | 官方 |
| `claude-api` | 加载 Claude API / Agent SDK 多语言参考文档 | 官方 |
| `frontend-design` | 生成高设计质量的生产级前端界面 | 官方 |
| `planning-with-files` | 用持久化 markdown 文件作为磁盘工作记忆 | 官方 |
| `debug` | 读取会话日志并分析 Claude Code 自身问题 | 官方 |
| `using-superpowers` | 建立如何寻找和使用 skill 的会话规范 | 官方 |
| `claude-command-suite` | 216+ 专业命令与 AI 代理工作流集合 | 社区 |
| `production-commands` | 生产就绪的多代理编排命令集 | 社区 |
| `claude-code-skills` | 覆盖研究、测试、审查的完整交付工作流 | 社区 |

### MCPs（20 项）

| 名称 | 描述 | 来源 |
|------|------|------|
| `filesystem` | 本地文件系统安全读写 | 官方 |
| `memory` | 基于知识图谱的跨会话持久化记忆 | 官方 |
| `fetch` | 抓取网页内容并转换为 LLM 友好格式 | 官方 |
| `git` | 读取、搜索和操作本地 Git 仓库 | 官方 |
| `sequential-thinking` | 通过思维链进行动态反思性问题求解 | 官方 |
| `github` | GitHub Issues、PR、代码搜索与工作流 | 官方 |
| `gitlab` | GitLab 仓库、MR 和 CI/CD 集成 | 官方 |
| `postgres` | PostgreSQL 数据库只读查询与 schema 检查 | 官方 |
| `sqlite` | SQLite 数据库操作与业务洞察 | 官方 |
| `google-drive` | Google Docs / Sheets / Slides 读写访问 | 官方 |
| `slack` | Slack 频道读取、线程总结与消息发送 | 官方 |
| `brave-search` | Brave 搜索引擎网页与本地结果查询 | 官方 |
| `puppeteer` | Puppeteer 浏览器自动化与网页截图 | 官方 |
| `sentry` | Sentry 错误追踪与 Issue 管理 | 官方 |
| `playwright` | Microsoft Playwright 浏览器自动化 | 官方 |
| `supabase` | Supabase 数据库、Auth 与 Edge Functions | 社区 |
| `cloudflare` | 部署管理 Cloudflare Workers、KV、R2 和 D1 | 社区 |
| `motherduck` | DuckDB / MotherDuck 分析型 SQL 查询 | 社区 |
| `firecrawl` | 网页深度爬取与结构化数据提取 | 社区 |
| `exa` | 为 AI 设计的语义搜索引擎 | 社区 |

---

## 贡献 Catalog

Catalog 以 JSON 文件形式维护，欢迎通过 PR 添加高质量的社区 Skills 和 MCPs。

### 文件位置

```
catalog/
├── skills.json
└── mcps.json
```

### 添加新条目

在对应 JSON 的 `items` 数组中追加：

```jsonc
// Skills 条目
{
  "name": "your-skill",           // skill 目录名（~/.claude/skills/<name>/）
  "description": "简短描述",
  "source": "community",          // "official" | "community"
  "repo": "https://github.com/you/your-skill",
  "installs": 1200                // 安装量（手动估算时设置 manualStats: true）
}

// MCPs 条目
{
  "name": "your-mcp",
  "description": "简短描述",
  "source": "community",
  "package": "your-mcp-package",  // npm 包名（有则填，无则省略）
  "repo": "https://github.com/you/your-mcp"
}
```

### `manualStats` 字段

当条目无法通过 npm / GitHub API 自动获取准确数据时，设置 `"manualStats": true`，由维护者手动维护 `installs` 字段：

```json
{
  "name": "my-skill",
  "installs": 500,
  "manualStats": true
}
```

**适用场景**：
- 多个 skills 指向同一 GitHub 仓库（无法区分个体数据）
- 小众或个人项目
- 使用 pip/其他包管理器分发，不在 npm 上

---

## 开发者指南

### 环境要求

- Node.js 18+
- npm 9+

### 本地开发

```bash
git clone https://github.com/your-org/claude-env
cd claude-env
npm install

# 开发模式（直接运行 TypeScript）
npm run dev -- init
npm run dev -- check

# 类型检查
npm run lint

# 运行测试
npm test

# 构建
npm run build
```

### 发布前更新 Catalog 数据

```bash
# 可选：设置 GitHub Token 以提高速率限制（60 → 5000 次/小时）
export GITHUB_TOKEN=ghp_xxxxxxxx

npm run update-stats
```

脚本会自动从 npm API 拉取最近 30 天下载量、从 GitHub API 拉取 star 数，
跳过标记了 `manualStats: true` 的条目。更新完成后即可 `npm publish`。

### 项目结构

```
claude-env/
├── catalog/
│   ├── skills.json          # Skills catalog（含安装量）
│   └── mcps.json            # MCPs catalog（含安装量）
├── scripts/
│   └── update-catalog-stats.ts  # 发布前更新统计数据
├── src/
│   ├── index.ts             # CLI 入口（Commander）
│   ├── commands/
│   │   ├── init.ts          # claude-env init
│   │   └── check.ts         # claude-env check
│   ├── detectors/           # 检测本地已安装的 Skills/MCPs/Hooks/Plugins
│   ├── catalog/             # Catalog 加载、活跃度分级（filters.ts）
│   ├── config/              # profile.json 读写、claude 配置读取
│   └── ui/
│       ├── InitWizard.tsx       # 初始化向导（多步骤）
│       ├── CheckReport.tsx      # 检测报告展示
│       └── EnhancedCheckboxList.tsx  # 带分页/搜索/筛选的选择列表
└── tests/
    ├── detectors/           # 各检测器单元测试
    └── catalog/             # Catalog 加载测试
```

### 活跃度分级阈值

分级定义集中在 `src/catalog/filters.ts` 的 `ACTIVITY_TIERS` 数组中，
修改此处即可调整所有筛选区间，无需改动其他文件：

```typescript
export const ACTIVITY_TIERS: ActivityTier[] = [
  { label: '>500K',     min: 500_001,  max: Infinity },
  { label: '500K-200K', min: 200_001,  max: 500_000  },
  // ...
  { label: '<1K',       min: 0,        max: 1_000    },
]
```

---

## License

MIT
