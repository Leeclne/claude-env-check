# Contributing Guide / 贡献指南

Thank you for your interest in claude-env! Here is how you can contribute.

感谢你对 claude-env 的关注！以下是参与贡献的方式。

---

## Types of contributions / 贡献类型

### 1. Add catalog entries (most common) / 添加 Catalog 条目（最常见）

The catalog is the part of this project that most needs community maintenance. You can contribute via PR:

Catalog 是本项目最需要社区维护的部分。你可以通过 PR 添加：

- High-quality community Skills (well-maintained, notable GitHub stars)
- Active community MCP Servers (consistently growing npm downloads)

- 高质量的社区 Skills（GitHub stars 较高、有人维护）
- 活跃的社区 MCP Servers（npm 下载量持续增长）

**Steps / 操作步骤:**

1. Fork this repository / Fork 本仓库
2. Add a new entry to `catalog/skills.json` or `catalog/mcps.json` / 在 `catalog/skills.json` 或 `catalog/mcps.json` 中添加新条目
3. Open a PR with the title format: `catalog: add <name> [skill|mcp]` / 提交 PR，标题格式：`catalog: add <name> [skill|mcp]`

**Entry format / 条目格式参考:**

```jsonc
// catalog/skills.json new entry example / 新增条目示例
{
  "name": "your-skill",
  "description": "One-line description of what this skill does",
  "source": "community",
  "repo": "https://github.com/author/repo",
  "installs": 800         // GitHub stars or estimated install count
  // If data cannot be fetched automatically:
  // 如果无法自动拉取数据：
  // "manualStats": true
}

// catalog/mcps.json new entry example (with npm package) / 新增条目示例（有 npm 包）
{
  "name": "your-mcp",
  "description": "One-line description",
  "source": "community",
  "package": "npm-package-name",
  "repo": "https://github.com/author/repo"
  // omit installs — the update-stats script will fetch it automatically
  // installs 不填，由 update-stats 脚本自动拉取
}
```

**Acceptance criteria / 入选标准:**

| Type | Criteria |
|------|----------|
| Skills | GitHub repo stars ≥ 100, or evidence of active maintenance |
| MCPs (npm package) | npm downloads (last 30 days) ≥ 1,000 |
| MCPs (non-npm) | GitHub stars ≥ 200 |

| 类型 | 参考标准 |
|------|---------|
| Skills | GitHub repo stars ≥ 100，或有持续维护记录 |
| MCPs（npm 包） | 最近 30 天 npm 下载量 ≥ 1,000 |
| MCPs（非 npm） | GitHub stars ≥ 200 |

Entries that do not meet these numbers but are genuinely high-quality are welcome too — just include a brief justification.

不满足上述数字但确实高质量的条目也可以提交，附上理由即可。

---

### 2. Fix detection logic / 修复检测逻辑

If you find that a type of Claude Code configuration is detected incorrectly (false negatives or false positives), please open an issue or PR.

如果发现某类 Claude Code 配置检测不准确（漏报、误报），欢迎提 Issue 或 PR。

Detection logic lives in `src/detectors/`:

检测逻辑在 `src/detectors/` 目录：

| File | Detects |
|------|---------|
| `skills.ts` | `~/.claude/skills/` and `.claude/skills/` |
| `mcps.ts` | MCP config (`settings.json`, `.mcp.json`) |
| `hooks.ts` | Hooks config |
| `plugins.ts` | `~/.claude/plugins/installed_plugins.json` |

Test cases are in `tests/detectors/`. All PRs must pass `npm test`.

测试用例在 `tests/detectors/`，所有 PR 需通过 `npm test`。

---

### 3. Update statistics / 更新统计数据

The `installs` / `stars` data in the catalog needs periodic refreshing. The maintainer runs `npm run update-stats` before each release, but if you notice clearly outdated data, you are welcome to open a PR manually updating the values for affected entries.

Catalog 中的 `installs` / `stars` 数据需要定期刷新。Maintainer 会在每次发版前运行 `npm run update-stats`，但如果你发现数据明显过时，也可以直接提 PR 手动更新相关条目的数值。

---

## Local development / 本地开发

```bash
npm install
npm run lint    # type check / 类型检查
npm test        # run unit tests / 运行单元测试
npm run build   # compile / 编译
```

## PR conventions / PR 规范

- Use a clear prefix in the title: `catalog:` / `fix:` / `feat:` / `docs:`
- Catalog PRs only need to modify JSON files — no source code changes required
- Code PRs must pass both `npm run lint` and `npm test`

- 标题清晰说明改动类型：`catalog:` / `fix:` / `feat:` / `docs:`
- Catalog 类 PR 只改 JSON 文件即可，无需改动源码
- 代码类 PR 确保 `npm run lint` 和 `npm test` 全部通过
