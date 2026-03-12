/**
 * Crawls https://skills.sh/, filters entries with installs > 500,
 * and merges them into catalog/skills.json.
 *
 * Usage:
 *   npx tsx scripts/crawl-skills-sh.ts
 *
 * Optional: set GITHUB_TOKEN to raise the GitHub API rate limit
 *   export GITHUB_TOKEN=ghp_xxx
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const catalogDir = join(__dirname, '..', 'catalog')
const skillsPath = join(catalogDir, 'skills.json')

const MIN_INSTALLS = 500

// ── types ─────────────────────────────────────────────────────────────────────

type CatalogItem = {
  name: string
  description: string
  source: 'official' | 'community'
  repo?: string
  package?: string
  stars?: number
  installs?: number
  manualStats?: boolean
}

type Catalog = {
  version: string
  updatedAt: string
  items: CatalogItem[]
}

type SkillsShEntry = {
  name: string
  repo: string // "owner/repo" format
  installs: number
}

// ── parse installs string (e.g. "508.6K" → 508600) ───────────────────────

function parseInstalls(value: string | number): number {
  if (typeof value === 'number') return value
  const str = String(value).trim().replace(/,/g, '')
  const num = parseFloat(str)
  if (str.endsWith('K') || str.endsWith('k')) return Math.round(num * 1_000)
  if (str.endsWith('M') || str.endsWith('m')) return Math.round(num * 1_000_000)
  return Math.round(num)
}

// ── extract embedded Next.js data from HTML ───────────────────────────────

function extractNextData(html: string): unknown {
  // look for __NEXT_DATA__ script tag
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (nextDataMatch) {
    return JSON.parse(nextDataMatch[1])
  }
  return null
}

// ── recursively search JSON object for the skills array ──────────────────

function findSkillsArray(obj: unknown, depth = 0): SkillsShEntry[] | null {
  if (depth > 10 || obj === null || typeof obj !== 'object') return null

  if (Array.isArray(obj)) {
    // check if this looks like a skills array (has name, repo/slug, installs fields)
    if (
      obj.length > 5 &&
      obj[0] &&
      typeof obj[0] === 'object' &&
      ('name' in (obj[0] as object)) &&
      (('installs' in (obj[0] as object)) || ('slug' in (obj[0] as object)))
    ) {
      return obj as SkillsShEntry[]
    }
    for (const item of obj) {
      const result = findSkillsArray(item, depth + 1)
      if (result) return result
    }
  } else {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      const result = findSkillsArray(val, depth + 1)
      if (result) return result
    }
  }
  return null
}

// ── parse skills table from HTML (Next.js RSC format) ────────────────────
//
// HTML structure example:
//   <a href="/vercel-labs/skills/find-skills">
//     <div>1</div>
//     <div><h3>find-skills</h3><p>vercel-labs/skills</p></div>
//     <div><span class="font-mono ...">508.6K</span></div>
//   </a>

function extractInlineJsonData(html: string): SkillsShEntry[] {
  const results: SkillsShEntry[] = []
  const seen = new Set<string>()

  // match skill entry links: href="/owner/repo/skill-name"
  // followed by rank, skill name (h3), repo (p), install count (font-mono span)
  const pattern =
    /href="\/([^/"]+\/[^/"]+\/[^/"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<span[^>]*font-mono[^>]*>([\d.,KkMm]+)<\/span>/g

  for (const m of html.matchAll(pattern)) {
    const [, _path, name, repo, installsStr] = m
    if (!seen.has(name)) {
      seen.add(name)
      results.push({
        name: name.trim(),
        repo: repo.trim(),
        installs: parseInstalls(installsStr.trim()),
      })
    }
  }

  return results
}

// ── fetch skills.sh page ──────────────────────────────────────────────────

async function fetchSkillsSh(): Promise<SkillsShEntry[]> {
  console.log('🌐 Fetching https://skills.sh/ ...')

  const res = await fetch('https://skills.sh/', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const html = await res.text()
  console.log(`  ✓ Fetched successfully, HTML size: ${(html.length / 1024).toFixed(1)} KB`)

  // Method 1: Next.js __NEXT_DATA__
  const nextData = extractNextData(html)
  if (nextData) {
    console.log('  ✓ Found __NEXT_DATA__, extracting skills list...')
    const skills = findSkillsArray(nextData)
    if (skills && skills.length > 0) {
      console.log(`  ✓ Extracted ${skills.length} entries from __NEXT_DATA__`)
      return skills
    }
  }

  // Method 2: parse HTML structure (Next.js RSC server-rendered HTML)
  console.log('  ✓ Page uses RSC format, parsing HTML structure...')
  const inlineData = extractInlineJsonData(html)
  if (inlineData.length > 0) {
    console.log(`  ✓ Extracted ${inlineData.length} entries from HTML structure`)
    return inlineData
  }

  // Method 3: fallback — loose regex
  console.log('  ⚠ Structured parsing failed, trying loose mode...')
  return parseHtmlTable(html)
}

// ── parse HTML table structure (fallback) ────────────────────────────────

function parseHtmlTable(html: string): SkillsShEntry[] {
  const results: SkillsShEntry[] = []
  const seen = new Set<string>()

  // match row patterns containing skill data
  // rough format: rank, skill name, repo, install count
  const patterns = [
    // match "name":"xxx","installs":xxx format
    /"name"\s*:\s*"([^"]+)"[^}]*"installs"\s*:\s*([0-9]+)/g,
    // match numeric patterns in table rows
    /([a-z][a-z0-9-]+)\s+([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+)\s+([\d.]+[KkMm]?)/g,
  ]

  for (const pattern of patterns) {
    const matches = [...html.matchAll(pattern)]
    for (const m of matches) {
      const name = m[1]
      if (!seen.has(name)) {
        seen.add(name)
        results.push({
          name,
          repo: '',
          installs: parseInstalls(m[2] || '0'),
        })
      }
    }
    if (results.length > 10) break
  }

  return results
}

// ── fetch GitHub repository stars ─────────────────────────────────────────

async function fetchGitHubStars(ownerRepo: string): Promise<number> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'skills-sh-crawler',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${ownerRepo}`, { headers })
    if (!res.ok) return 0
    const data = (await res.json()) as { stargazers_count?: number; description?: string }
    return data.stargazers_count ?? 0
  } catch {
    return 0
  }
}

// ── fetch skill detail page to get description ────────────────────────────

async function fetchSkillDescription(skillName: string): Promise<string> {
  try {
    const res = await fetch(`https://skills.sh/${skillName}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return ''
    const html = await res.text()

    // try meta description
    const metaMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/)
    if (metaMatch) return metaMatch[1]

    // try og:description
    const ogMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)
    if (ogMatch) return ogMatch[1]
  } catch {
    // ignore errors
  }
  return ''
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 skills.sh crawler started\n')

  // 1. fetch data
  let rawSkills = await fetchSkillsSh()

  if (rawSkills.length === 0) {
    console.error('❌ No data retrieved. Check network or page structure changes.')
    process.exit(1)
  }

  console.log(`\n📊 Raw data: ${rawSkills.length} entries`)

  // 2. filter installs > MIN_INSTALLS
  const filtered = rawSkills.filter((s) => {
    const installs = parseInstalls(s.installs)
    return installs > MIN_INSTALLS
  })
  console.log(`📊 After filter (installs > ${MIN_INSTALLS}): ${filtered.length} entries\n`)

  // 3. load existing skills.json
  const catalog = JSON.parse(readFileSync(skillsPath, 'utf-8')) as Catalog
  const existingNames = new Set(catalog.items.map((i) => i.name))

  // 4. process new entries
  let addedCount = 0
  let skippedCount = 0

  for (const skill of filtered) {
    const name = skill.name || ''
    if (!name) continue

    if (existingNames.has(name)) {
      console.log(`  ⊘ skip (already exists): ${name}`)
      skippedCount++
      continue
    }

    process.stdout.write(`  + processing: ${name} (installs: ${parseInstalls(skill.installs).toLocaleString()})... `)

    // build repo URL
    let repoUrl = ''
    const repoSlug = skill.repo || ''
    if (repoSlug) {
      if (repoSlug.startsWith('http')) {
        repoUrl = repoSlug
      } else if (repoSlug.includes('/')) {
        repoUrl = `https://github.com/${repoSlug}`
      }
    }

    // try to get description
    let description = await fetchSkillDescription(name)
    if (!description && repoUrl.includes('github.com')) {
      // fall back to GitHub repo description
      const ownerRepo = repoSlug.includes('/')
        ? repoSlug
        : repoUrl.replace('https://github.com/', '')
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'skills-sh-crawler',
      }
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
      }
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${ownerRepo}`, { headers })
        if (ghRes.ok) {
          const ghData = (await ghRes.json()) as { description?: string; stargazers_count?: number }
          description = ghData.description || ''
        }
      } catch {
        // ignore
      }
    }

    const newItem: CatalogItem = {
      name,
      description: description || `${name} skill`,
      source: 'community',
      ...(repoUrl ? { repo: repoUrl } : {}),
      installs: parseInstalls(skill.installs),
    }

    catalog.items.push(newItem)
    existingNames.add(name)
    addedCount++
    console.log(`✓ (${description ? 'has description' : 'no description'})`)

    // throttle requests
    await new Promise((r) => setTimeout(r, 300))
  }

  // 5. update timestamp and write file
  catalog.updatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(skillsPath, JSON.stringify(catalog, null, 2) + '\n')

  console.log(`
✅ Done!
   Added:   ${addedCount}
   Skipped: ${skippedCount} (already existed)
   Total:   ${catalog.items.length}
   File updated: catalog/skills.json
`)
}

main().catch((err) => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
