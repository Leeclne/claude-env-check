/**
 * 在 npm publish 前运行此脚本，自动更新 catalog 里的 installs / stars 数据：
 *   npm run update-stats
 *
 * 数据来源：
 *   - 有 package 字段的条目  → npm 最近 30 天下载量 → installs
 *   - 有 repo (GitHub) 字段  → GitHub stars → stars，并将 installs 设为 stars（近似值）
 *
 * 可选：设置 GITHUB_TOKEN 环境变量以提高 GitHub API 速率限制（60 → 5000 次/小时）
 *   export GITHUB_TOKEN=ghp_xxx
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const catalogDir = join(__dirname, '..', 'catalog')

type CatalogItem = {
  name: string
  description: string
  source: 'official' | 'community'
  repo?: string
  package?: string
  stars?: number
  installs?: number
}

type Catalog = {
  version: string
  updatedAt: string
  items: CatalogItem[]
}

// ── npm 下载量 ─────────────────────────────────────────────────────────────

async function fetchNpmDownloads(pkg: string): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`    ⚠ npm API 返回 ${res.status}，跳过`)
      return 0
    }
    const data = (await res.json()) as { downloads?: number }
    return data.downloads ?? 0
  } catch (err) {
    console.warn(`    ⚠ 请求失败：${err}`)
    return 0
  }
}

// ── GitHub stars ───────────────────────────────────────────────────────────

async function fetchGitHubStars(repoUrl: string): Promise<number> {
  // 从 https://github.com/owner/repo 提取 owner/repo
  const match = repoUrl.match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?(?:[/?#]|$)/)
  if (!match?.[1]) {
    console.warn(`    ⚠ 无法解析 GitHub URL: ${repoUrl}`)
    return 0
  }
  const slug = match[1]
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}`, { headers })
    if (!res.ok) {
      console.warn(`    ⚠ GitHub API 返回 ${res.status}，跳过`)
      return 0
    }
    const data = (await res.json()) as { stargazers_count?: number }
    return data.stargazers_count ?? 0
  } catch (err) {
    console.warn(`    ⚠ 请求失败：${err}`)
    return 0
  }
}

// ── 主逻辑 ─────────────────────────────────────────────────────────────────

async function updateCatalog(filename: string): Promise<void> {
  const filePath = join(catalogDir, filename)
  const catalog = JSON.parse(readFileSync(filePath, 'utf-8')) as Catalog

  for (const item of catalog.items) {
    if (item.manualStats) {
      console.log(`  ${item.name}... 跳过（manualStats: true，由维护者手动维护）`)
      continue
    }

    process.stdout.write(`  ${item.name}... `)

    if (item.package) {
      const downloads = await fetchNpmDownloads(item.package)
      item.installs = downloads
      console.log(`npm 下载量 → ${downloads.toLocaleString()}`)
    } else if (item.repo?.includes('github.com')) {
      const stars = await fetchGitHubStars(item.repo)
      item.stars = stars
      // GitHub stars 作为 installs 的近似值（无精确安装数时的 fallback）
      item.installs = stars
      console.log(`GitHub ⭐ → ${stars.toLocaleString()}`)
    } else {
      console.log('无 package / repo，跳过')
    }

    // 避免触发 API 速率限制
    await new Promise((r) => setTimeout(r, 350))
  }

  catalog.updatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(filePath, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`  ✅ 已写入 ${filename}\n`)
}

async function main() {
  console.log('🔄 更新 catalog 统计数据...\n')
  console.log('→ catalog/skills.json')
  await updateCatalog('skills.json')
  console.log('→ catalog/mcps.json')
  await updateCatalog('mcps.json')
  console.log('✅ 完成！catalog 数据已更新，可以运行 npm publish。')
}

main().catch((err) => {
  console.error('❌ 脚本执行失败：', err)
  process.exit(1)
})
