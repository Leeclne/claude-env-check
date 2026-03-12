import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

export type CatalogItem = {
  name: string
  description: string
  source: 'official' | 'community'
  repo?: string
  package?: string
  stars?: number
  installs?: number
  /**
   * true = installs/stars are maintained manually by the maintainer;
   * the update-stats script will skip this entry.
   * Use for niche, personal, or projects not trackable via npm/GitHub API.
   */
  manualStats?: boolean
}

export type Catalog = {
  version: string
  updatedAt: string
  items: CatalogItem[]
}

function getCatalogDir(): string {
  // Works both from src/ (tsx dev) and dist/ (compiled)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  // src/catalog/loader.ts -> ../../catalog/
  // dist/catalog/loader.js -> ../../catalog/
  return join(__dirname, '..', '..', 'catalog')
}

export function loadSkillsCatalog(): Catalog {
  const catalogDir = getCatalogDir()
  const raw = readFileSync(join(catalogDir, 'skills.json'), 'utf-8')
  return JSON.parse(raw) as Catalog
}

export function loadMcpsCatalog(): Catalog {
  const catalogDir = getCatalogDir()
  const raw = readFileSync(join(catalogDir, 'mcps.json'), 'utf-8')
  return JSON.parse(raw) as Catalog
}
