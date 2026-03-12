# 贡献指南

感谢你对 claude-env 的关注！以下是参与贡献的方式。

## 贡献类型

### 1. 添加 Catalog 条目（最常见）

Catalog 是本项目最需要社区维护的部分。你可以通过 PR 添加：

- 高质量的社区 Skills（GitHub stars 较高、有人维护）
- 活跃的社区 MCP Servers（npm 下载量持续增长）

**操作步骤**：

1. Fork 本仓库
2. 在 `catalog/skills.json` 或 `catalog/mcps.json` 中添加新条目
3. 提交 PR，标题格式：`catalog: add <name> [skill|mcp]`

**条目格式参考**：

```jsonc
// catalog/skills.json 新增条目示例
{
  "name": "your-skill",
  "description": "一句话描述这个 skill 的功能",
  "source": "community",
  "repo": "https://github.com/author/repo",
  "installs": 800         // GitHub stars 或估算安装量
  // 如果无法自动拉取数据：
  // "manualStats": true
}

// catalog/mcps.json 新增条目示例（有 npm 包）
{
  "name": "your-mcp",
  "description": "一句话描述",
  "source": "community",
  "package": "npm-package-name",
  "repo": "https://github.com/author/repo"
  // installs 不填，由 update-stats 脚本自动拉取
}
```

**入选标准**：

| 类型 | 参考标准 |
|------|---------|
| Skills | GitHub repo stars ≥ 100，或有持续维护记录 |
| MCPs（npm 包） | 最近 30 天 npm 下载量 ≥ 1,000 |
| MCPs（非 npm） | GitHub stars ≥ 200 |

不满足上述数字但确实高质量的条目也可以提交，附上理由即可。

---

### 2. 修复检测逻辑

如果发现某类 Claude Code 配置检测不准确（漏报、误报），欢迎提 Issue 或 PR。

检测逻辑在 `src/detectors/` 目录：

| 文件 | 负责检测 |
|------|---------|
| `skills.ts` | `~/.claude/skills/` 及 `.claude/skills/` |
| `mcps.ts` | MCP 配置（`settings.json`、`.mcp.json`） |
| `hooks.ts` | Hooks 配置 |
| `plugins.ts` | `~/.claude/plugins/installed_plugins.json` |

测试用例在 `tests/detectors/`，所有 PR 需通过 `npm test`。

---

### 3. 更新统计数据

Catalog 中的 `installs` / `stars` 数据需要定期刷新。
Maintainer 会在每次发版前运行 `npm run update-stats`，但如果你发现数据明显过时，
也可以直接提 PR 手动更新相关条目的数值。

---

## 本地开发

```bash
npm install
npm run lint    # 类型检查
npm test        # 运行单元测试
npm run build   # 编译
```

## PR 规范

- 标题清晰说明改动类型：`catalog:` / `fix:` / `feat:` / `docs:`
- Catalog 类 PR 只改 JSON 文件即可，无需改动源码
- 代码类 PR 确保 `npm run lint` 和 `npm test` 全部通过
