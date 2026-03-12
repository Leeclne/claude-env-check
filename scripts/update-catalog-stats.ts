/**
 * Run this script before npm publish to auto-update installs/stars in the catalog:
 *   npm run update-stats
 *
 * Data sources:
 *   - Entries with a `package` field  → npm last-30-day downloads → installs
 *   - Entries with a `repo` (GitHub)  → GitHub stars → stars, also used as installs approximation
 *
 * Optional: set GITHUB_TOKEN to raise the GitHub API rate limit (60 → 5000 req/hour)
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

// ── npm downloads ──────────────────────────────────────────────────────────

async function fetchNpmDownloads(pkg: string): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`    ⚠ npm API returned ${res.status}, skipping`)
      return 0
    }
    const data = (await res.json()) as { downloads?: number }
    return data.downloads ?? 0
  } catch (err) {
    console.warn(`    ⚠ Request failed: ${err}`)
    return 0
  }
}

// ── GitHub stars ───────────────────────────────────────────────────────────

async function fetchGitHubStars(repoUrl: string): Promise<number> {
  // extract owner/repo from https://github.com/owner/repo
  const match = repoUrl.match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?(?:[/?#]|$)/)
  if (!match?.[1]) {
    console.warn(`    ⚠ Cannot parse GitHub URL: ${repoUrl}`)
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
      console.warn(`    ⚠ GitHub API returned ${res.status}, skipping`)
      return 0
    }
    const data = (await res.json()) as { stargazers_count?: number }
    return data.stargazers_count ?? 0
  } catch (err) {
    console.warn(`    ⚠ Request failed: ${err}`)
    return 0
  }
}

// ── main logic ─────────────────────────────────────────────────────────────

async function updateCatalog(filename: string): Promise<void> {
  const filePath = join(catalogDir, filename)
  const catalog = JSON.parse(readFileSync(filePath, 'utf-8')) as Catalog

  for (const item of catalog.items) {
    if (item.manualStats) {
      console.log(`  ${item.name}... skipped (manualStats: true, maintained manually)`)
      continue
    }

    process.stdout.write(`  ${item.name}... `)

    if (item.package) {
      const downloads = await fetchNpmDownloads(item.package)
      item.installs = downloads
      console.log(`npm downloads → ${downloads.toLocaleString()}`)
    } else if (item.repo?.includes('github.com')) {
      const stars = await fetchGitHubStars(item.repo)
      item.stars = stars
      // GitHub stars used as installs approximation when no precise data is available
      item.installs = stars
      console.log(`GitHub ⭐ → ${stars.toLocaleString()}`)
    } else {
      console.log('no package / repo, skipping')
    }

    // avoid hitting API rate limits
    await new Promise((r) => setTimeout(r, 350))
  }

  catalog.updatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(filePath, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`  ✅ Written to ${filename}\n`)
}

async function main() {
  console.log('🔄 Updating catalog stats...\n')
  console.log('→ catalog/skills.json')
  await updateCatalog('skills.json')
  console.log('→ catalog/mcps.json')
  await updateCatalog('mcps.json')
  console.log('✅ Done! Catalog stats updated. Ready to run npm publish.')
}

main().catch((err) => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
