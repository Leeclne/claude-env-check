# claude-env

> Claude Code environment baseline manager — verify your Skills, MCPs, Plugins, and Hooks are ready in any new project with a single command.

> Claude Code 环境基线管理工具 — 在任意新项目中一键核查你的 Skills、MCPs、Plugins 和 Hooks 是否就绪。

---

## Overview / 简介

**EN:** Every time you open a new project, do you need to re-check whether the `commit` skill is installed, MCPs are configured, and your usual plugins are enabled? **claude-env** saves your Claude Code preferences as a "baseline profile". Afterwards, run `claude-env check` in any project directory to instantly see what is missing and what is ready.

It **only detects and reports — it never auto-installs anything**.

**ZH:** 每次打开一个新项目，你是否需要重新确认 `commit` skill 有没有装、MCP 有没有配好、常用插件有没有启用？**claude-env** 把你的 Claude Code 使用习惯保存为一份「基线配置」，之后在任何项目目录执行 `claude-env check`，就能立刻看到哪些东西还没装、哪些已经就绪。

它**只做检测和提示，不会自动安装任何东西**。

```
claude-env check

  Claude Environment Check — /Users/me/my-project

  Skills
  ✅ commit              installed 🌍
  ✅ find-skills         installed 🌍
  ❌ review-pr           in baseline but not installed in this project

  MCPs
  ✅ filesystem          configured 🌍
  ❌ memory              in baseline but not configured in this project

  ────────────────────────────────────────
  ⚠️  2 item(s) missing. Install them manually using the list above.
```

---

## Installation / 安装

```bash
npm install -g claude-env
```

---

## Usage / 使用

### `claude-env init` — Set up baseline profile / 初始化基线配置

Run this on first use, or whenever you want to update your preferences. Launches an interactive wizard to select your preferred Skills and MCPs from the built-in catalog, plus any detected Plugins.

首次使用，或想重新调整偏好时运行。启动一个交互式向导，从内置 Catalog 中选择你习惯使用的 Skills 和 MCPs，以及已检测到的 Plugins。

```bash
claude-env init
```

The wizard has 2–3 steps (3 when Plugins are detected):

向导共分 2–3 步（有 Plugin 时为 3 步）：

| Step | Content |
|------|---------|
| Step 1 | Select **Skills** from the catalog |
| Step 2 | Select **MCPs** from the catalog |
| Step 3 | Select **Plugins** from detected local installs (skipped if none found) |
| Confirm | Preview all selections, press Enter to save |

| 步骤 | 内容 |
|------|------|
| 第 1 步 | 从 Catalog 中选择 **Skills** |
| 第 2 步 | 从 Catalog 中选择 **MCPs** |
| 第 3 步 | 从已检测到的本地安装中选择 **Plugins**（无 Plugin 时自动跳过）|
| 确认 | 预览所有选择，按 Enter 保存 |

The baseline profile is saved to `~/.claude-env/profile.json`.

基线配置保存于 `~/.claude-env/profile.json`。

#### Key bindings / 交互按键

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move cursor within the current page |
| `←` / `→` | Page through results |
| `Space` | Toggle selection of current item |
| `/` | Enter search mode — filter by name or description |
| `f` | Cycle activity filter (`>500K` → `500K-200K` → … → `<1K` → All) |
| `Esc` | In search mode: exit search; otherwise: go back to previous step |
| `↓` to `[ Save & Continue → ]` + `Enter` | Confirm step and proceed |
| `q` | Quit at any time |

| 按键 | 功能 |
|------|------|
| `↑` / `↓` | 在当前页内上下移动 |
| `←` / `→` | 翻页 |
| `空格` | 选中 / 取消当前项 |
| `/` | 进入搜索模式，按名称或描述过滤 |
| `f` | 循环切换活跃度筛选（`>500K` → `500K-200K` → … → `<1K` → 全部） |
| `Esc` | 搜索模式下：退出搜索；否则：返回上一步 |
| `↓` 到 `[ Save & Continue → ]` + `Enter` | 确认当前步骤，进入下一步 |
| `q` | 随时退出 |

---

### `claude-env check` — Check current project environment / 检查当前项目环境

Run in any project directory to compare against the baseline and list missing items.

在任意项目目录运行，对比基线，列出缺失项。

```bash
cd ~/my-project
claude-env check
```

Detection scope / 检测范围：

| Type | Location |
|------|----------|
| Skills | `~/.claude/skills/` 🌍 and `.claude/skills/` 📁 |
| MCPs | `~/.claude/settings.json`, `.mcp.json`, etc. |
| Hooks | `~/.claude/settings.json` and project-level config |
| Plugins | `~/.claude/plugins/installed_plugins.json` |

- 🌍 = global install (shared across all projects)
- 📁 = project-level install (current project only)

- 🌍 = 全局安装（所有项目共享）
- 📁 = 项目级安装（仅当前项目）

---

## Built-in Catalog / 内置 Catalog

The catalog includes official and highly active community Skills and MCPs, shown in the `init` wizard. All entries include install counts and can be filtered by activity level.

Catalog 收录了官方和高活跃社区的 Skills 与 MCPs，供 `init` 向导展示选择。所有条目均包含安装量数据，可通过活跃度筛选快速找到适合自己的工具。

### Skills

| Name | Description | Source |
|------|-------------|--------|
| `commit` | Generate conventional git commit messages | official |
| `review-pr` | Code review for Pull Requests | official |
| `find-skills` | Discover and install community skills | official |
| `simplify` | Three parallel agents review and optimize code quality | official |
| `batch` | Large-scale parallel changes across codebases | official |
| `loop` | Repeatedly run a prompt on a schedule | official |
| `claude-api` | Load Claude API / Agent SDK multi-language reference docs | official |
| `frontend-design` | Generate production-grade frontend UIs with high design quality | official |
| `planning-with-files` | Disk-based working memory via persistent markdown files | official |
| `debug` | Read session logs and diagnose Claude Code issues | official |
| `using-superpowers` | Establish skill discovery conventions at session start | official |
| `claude-command-suite` | 216+ professional commands and AI agent workflow collection | community |
| `production-commands` | Production-ready multi-agent orchestration command set | community |
| `claude-code-skills` | Full delivery workflow covering research, testing, and review | community |

### MCPs

| Name | Description | Source |
|------|-------------|--------|
| `filesystem` | Safe local filesystem read/write | official |
| `memory` | Knowledge-graph-based cross-session persistent memory | official |
| `fetch` | Fetch web content and convert to LLM-friendly format | official |
| `git` | Read, search, and operate local Git repositories | official |
| `sequential-thinking` | Dynamic reflective problem solving via chain of thought | official |
| `github` | GitHub Issues, PRs, code search, and workflows | official |
| `gitlab` | GitLab repos, MRs, and CI/CD integration | official |
| `postgres` | PostgreSQL read-only queries and schema inspection | official |
| `sqlite` | SQLite database operations and business insights | official |
| `google-drive` | Google Docs / Sheets / Slides read/write access | official |
| `slack` | Slack channel reading, thread summaries, and message sending | official |
| `brave-search` | Brave search engine web and local results | official |
| `puppeteer` | Puppeteer browser automation and screenshots | official |
| `sentry` | Sentry error tracking and issue management | official |
| `playwright` | Microsoft Playwright browser automation | official |
| `supabase` | Supabase database, Auth, and Edge Functions | community |
| `cloudflare` | Deploy and manage Cloudflare Workers, KV, R2, and D1 | community |
| `motherduck` | DuckDB / MotherDuck analytical SQL queries | community |
| `firecrawl` | Deep web crawling and structured data extraction | community |
| `exa` | AI-native semantic search engine | community |

---

## Contributing to the Catalog / 贡献 Catalog

The catalog is maintained as JSON files. PRs to add high-quality community Skills and MCPs are welcome.

Catalog 以 JSON 文件形式维护，欢迎通过 PR 添加高质量的社区 Skills 和 MCPs。

### File locations / 文件位置

```
catalog/
├── skills.json
└── mcps.json
```

### Adding a new entry / 添加新条目

Append to the `items` array in the relevant JSON file:

在对应 JSON 的 `items` 数组中追加：

```jsonc
// Skills entry
{
  "name": "your-skill",           // skill directory name (~/.claude/skills/<name>/)
  "description": "Short description",
  "source": "community",          // "official" | "community"
  "repo": "https://github.com/you/your-skill",
  "installs": 1200                // install count (set manualStats: true if manually estimated)
}

// MCPs entry
{
  "name": "your-mcp",
  "description": "Short description",
  "source": "community",
  "package": "your-mcp-package",  // npm package name (omit if not on npm)
  "repo": "https://github.com/you/your-mcp"
}
```

### The `manualStats` field

When accurate data cannot be fetched automatically via npm / GitHub API, set `"manualStats": true` and maintain the `installs` field manually:

当条目无法通过 npm / GitHub API 自动获取准确数据时，设置 `"manualStats": true`，由维护者手动维护 `installs` 字段：

```json
{
  "name": "my-skill",
  "installs": 500,
  "manualStats": true
}
```

**When to use / 适用场景:**
- Multiple skills point to the same GitHub repo (individual stats unavailable)
- Niche or personal projects
- Distributed via pip or other package managers, not on npm

- 多个 skills 指向同一 GitHub 仓库（无法区分个体数据）
- 小众或个人项目
- 使用 pip/其他包管理器分发，不在 npm 上

---

## Developer Guide / 开发者指南

### Requirements / 环境要求

- Node.js 18+
- npm 9+

### Local development / 本地开发

```bash
git clone https://github.com/your-org/claude-env
cd claude-env
npm install

# Development mode (run TypeScript directly) / 开发模式（直接运行 TypeScript）
npm run dev -- init
npm run dev -- check

# Type check / 类型检查
npm run lint

# Run tests / 运行测试
npm test

# Build / 构建
npm run build
```

### Update catalog stats before publishing / 发布前更新 Catalog 数据

```bash
# Optional: set GitHub Token to raise rate limit (60 → 5000 req/hour)
# 可选：设置 GitHub Token 以提高速率限制（60 → 5000 次/小时）
export GITHUB_TOKEN=ghp_xxxxxxxx

npm run update-stats
```

The script fetches npm download counts (last 30 days) and GitHub star counts, skipping entries marked `manualStats: true`. After it completes, run `npm publish`.

脚本会自动从 npm API 拉取最近 30 天下载量、从 GitHub API 拉取 star 数，跳过标记了 `manualStats: true` 的条目。更新完成后即可 `npm publish`。

### Project structure / 项目结构

```
claude-env/
├── catalog/
│   ├── skills.json          # Skills catalog (with install counts)
│   └── mcps.json            # MCPs catalog (with install counts)
├── scripts/
│   ├── update-catalog-stats.ts  # Update stats before publishing
│   └── crawl-skills-sh.ts       # Crawl skills.sh to import new entries
├── src/
│   ├── index.ts             # CLI entry point (Commander)
│   ├── commands/
│   │   ├── init.ts          # claude-env init
│   │   └── check.ts         # claude-env check
│   ├── detectors/           # Detect locally installed Skills/MCPs/Hooks/Plugins
│   ├── catalog/             # Catalog loading, activity tiers (filters.ts)
│   ├── config/              # profile.json read/write, Claude config reading
│   └── ui/
│       ├── InitWizard.tsx           # Multi-step init wizard
│       ├── CheckReport.tsx          # Detection report display
│       └── EnhancedCheckboxList.tsx # Paginated list with search and filter
└── tests/
    ├── detectors/           # Detector unit tests
    └── catalog/             # Catalog loading tests
```

### Activity tier thresholds / 活跃度分级阈值

Tier definitions are centralized in `ACTIVITY_TIERS` in `src/catalog/filters.ts`. Modify there to adjust all filter ranges with no other changes needed.

分级定义集中在 `src/catalog/filters.ts` 的 `ACTIVITY_TIERS` 数组中，修改此处即可调整所有筛选区间，无需改动其他文件。

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
